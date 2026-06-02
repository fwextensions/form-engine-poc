"use client";

import { useState, useCallback, useRef, type DragEvent, type ReactNode } from "react";
import { getGoogleApiKeyForExtraction } from "@/lib/settings";
import type { PdfExtractionResult } from "@/lib/pdf-extraction";

export interface PdfFile {
  file: File;
  dataUrl: string;
  base64: string;
}

export type PdfAction = "extract" | "attach" | null;

interface PdfDropZoneProps {
  children: ReactNode;
  onExtracted: (result: PdfExtractionResult, filename: string) => void;
  onAttachDirectly: (pdf: PdfFile) => void;
  disabled?: boolean;
}

type ExtractionState =
  | { status: "idle" }
  | { status: "choosing"; pdf: PdfFile }
  | { status: "extracting"; pdf: PdfFile; streamedText: string }
  | { status: "error"; message: string };

export function PdfDropZone({
  children,
  onExtracted,
  onAttachDirectly,
  disabled,
}: PdfDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<ExtractionState>({ status: "idle" });
  const dragCounterRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const readFileAsBase64 = useCallback((file: File): Promise<{ dataUrl: string; base64: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        resolve({ dataUrl, base64 });
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleExtract = useCallback(async (pdf: PdfFile) => {
    const googleKey = getGoogleApiKeyForExtraction();

    if (!googleKey) {
      setState({
        status: "error",
        message:
          "PDF extraction requires a Google API key. Set Google as your provider in Settings, or configure a Google API key for PDF extraction.",
      });
      return;
    }

    setState({ status: "extracting", pdf, streamedText: "" });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: googleKey,
          pdfData: pdf.base64,
          filename: pdf.file.name,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Unknown error" }));
        setState({ status: "error", message: err.error || `HTTP ${response.status}` });
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setState({ status: "error", message: "No response stream" });
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setState((prev) =>
          prev.status === "extracting"
            ? { ...prev, streamedText: accumulated }
            : prev,
        );
      }

      // Parse the final JSON
      const cleaned = accumulated
        .replace(/^```(?:json)?\s*/m, "")
        .replace(/\s*```\s*$/m, "")
        .trim();

      const result: PdfExtractionResult = JSON.parse(cleaned);
      setState({ status: "idle" });
      onExtracted(result, pdf.file.name);
    } catch (err: any) {
      if (err.name === "AbortError") {
        setState({ status: "idle" });
        return;
      }
      setState({
        status: "error",
        message: err.message || "Extraction failed",
      });
    } finally {
      abortRef.current = null;
    }
  }, [onExtracted]);

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;

      if (disabled) return;

      const items = Array.from(e.dataTransfer.items);
      const hasPdf = items.some(
        (item) => item.type === "application/pdf",
      );
      if (hasPdf) {
        setDragOver(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      const pdfFile = files.find((f) => f.type === "application/pdf");

      if (!pdfFile) return;

      try {
        const { dataUrl, base64 } = await readFileAsBase64(pdfFile);
        setState({
          status: "choosing",
          pdf: { file: pdfFile, dataUrl, base64 },
        });
      } catch {
        setState({ status: "error", message: "Failed to read the PDF file" });
      }
    },
    [disabled, readFileAsBase64],
  );

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: "idle" });
  }, []);

  const handleChooseExtract = useCallback(() => {
    if (state.status === "choosing") {
      handleExtract(state.pdf);
    }
  }, [state, handleExtract]);

  const handleChooseAttach = useCallback(() => {
    if (state.status === "choosing") {
      onAttachDirectly(state.pdf);
      setState({ status: "idle" });
    }
  }, [state, onAttachDirectly]);

  const fieldCount =
    state.status === "extracting" && state.streamedText
      ? countFieldsInStream(state.streamedText)
      : 0;

  return (
    <div
      className="relative flex flex-col h-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-50/90 border-2 border-dashed border-blue-400 rounded-lg">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-blue-700 font-medium">Drop PDF here</p>
          </div>
        </div>
      )}

      {/* Choice dialog */}
      {state.status === "choosing" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-slate-800 truncate max-w-[200px]">
                  {state.pdf.file.name}
                </p>
                <p className="text-xs text-slate-500">
                  {formatFileSize(state.pdf.file.size)}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              How would you like to use this PDF?
            </p>

            <div className="space-y-2">
              <button
                onClick={handleChooseExtract}
                className="w-full text-left p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <p className="font-medium text-blue-800 text-sm">Extract form fields</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Use Gemini Flash to identify questions, types, and options
                </p>
              </button>
              <button
                onClick={handleChooseAttach}
                className="w-full text-left p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <p className="font-medium text-slate-700 text-sm">Send to AI directly</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attach the PDF for the main model to process
                </p>
              </button>
            </div>

            <button
              onClick={handleCancel}
              className="w-full mt-3 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Extraction progress */}
      {state.status === "extracting" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="font-medium text-slate-800">Extracting fields...</p>
                <p className="text-xs text-slate-500">{state.pdf.file.name}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Streaming response</span>
                <span className="text-slate-800 font-mono">
                  {state.streamedText.length} chars
                </span>
              </div>
              {fieldCount > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  {fieldCount} field{fieldCount !== 1 ? "s" : ""} found so far...
                </p>
              )}
            </div>

            <button
              onClick={handleCancel}
              className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {state.status === "error" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium text-slate-800">Extraction failed</p>
            </div>
            <p className="text-sm text-slate-600 mb-4">{state.message}</p>
            <button
              onClick={handleCancel}
              className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function countFieldsInStream(text: string): number {
  const matches = text.match(/"label"\s*:/g);
  return matches?.length ?? 0;
}
