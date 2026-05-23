/**
 * Common types for form export operations.
 */

/** Severity level for export diagnostics. */
export type DiagnosticSeverity = "warning" | "info";

/**
 * A single diagnostic produced during export.
 * Warnings indicate features that couldn't be fully mapped.
 * Info messages note minor differences in the output.
 */
export interface ExportDiagnostic {
  severity: DiagnosticSeverity;
  /** The component ID (if applicable) that triggered this diagnostic. */
  componentId?: string;
  /** The component type that triggered this diagnostic. */
  componentType?: string;
  /** Human-readable description of what was lost or changed. */
  message: string;
}

/**
 * Result of an export operation.
 * Always produces output (best-effort), with diagnostics for anything lossy.
 */
export interface ExportResult<T = unknown> {
  /** The exported form data in the target format. */
  output: T;
  /** Diagnostics about features that couldn't be fully mapped. */
  diagnostics: ExportDiagnostic[];
}
