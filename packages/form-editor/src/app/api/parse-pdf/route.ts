import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { PDF_EXTRACTION_PROMPT } from "@/lib/pdf-extraction";

const EXTRACTION_MODEL = "gemini-2.0-flash";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, pdfData, filename } = body as {
      apiKey: string;
      pdfData: string; // base64-encoded PDF
      filename?: string;
    };

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google API key is required for PDF extraction" },
        { status: 400 },
      );
    }

    if (!pdfData) {
      return NextResponse.json(
        { error: "PDF data is required" },
        { status: 400 },
      );
    }

    console.log(`[Parse PDF] Extracting fields from ${filename ?? "uploaded PDF"}`);

    const google = createGoogleGenerativeAI({ apiKey });

    const result = streamText({
      model: google(EXTRACTION_MODEL),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: PDF_EXTRACTION_PROMPT,
            },
            {
              type: "file",
              data: pdfData,
              mediaType: "application/pdf",
            },
          ],
        },
      ],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[Parse PDF] Error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
