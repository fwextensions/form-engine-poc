/**
 * PDF field extraction types and prompt for Gemini Flash.
 */

export interface ExtractedField {
  /** PDF field ID if the field is an editable/interactive form field */
  fieldId?: string;
  /** Human-readable label or question text */
  label: string;
  /** Generic field type for robust extraction */
  type:
    | "short_text"
    | "long_text"
    | "email"
    | "phone"
    | "number"
    | "date"
    | "single_choice"
    | "multiple_choice"
    | "dropdown"
    | "checkbox"
    | "file_upload"
    | "signature"
    | "unknown";
  /** Options for choice-based fields */
  options?: string[];
  /** Whether the field appears to be required */
  required?: boolean;
  /** Any placeholder or hint text visible in the field */
  placeholder?: string;
  /** Additional notes about the field (e.g. validation constraints, formatting hints) */
  notes?: string;
}

export interface ExtractedSection {
  /** Section or group heading, if any */
  title?: string;
  /** Description or instructions for this section */
  description?: string;
  /** Fields within this section */
  fields: ExtractedField[];
}

export interface PdfExtractionResult {
  /** Overall form title, if identifiable */
  formTitle?: string;
  /** Overall form description or instructions */
  formDescription?: string;
  /** Logical sections/groups of fields */
  sections: ExtractedSection[];
  /** Any general notes about the extraction */
  notes?: string;
}

export type PendingPdfContext =
  | { type: "extraction"; result: PdfExtractionResult; filename: string }
  | { type: "attachment"; dataUrl: string; filename: string };

export const PDF_EXTRACTION_PROMPT = `You are a form field extraction specialist. Analyze this PDF document and extract all form fields, questions, and input areas.

**Priority**: If the PDF contains interactive/editable form fields (fillable PDF), extract those fields and their properties. Include the field ID/name from the PDF form data. For non-interactive PDFs, identify questions and input areas from the visual layout.

**Output format**: Respond with a single JSON object matching this structure:

\`\`\`
{
  "formTitle": "string or null",
  "formDescription": "string or null",
  "sections": [
    {
      "title": "string or null - logical section/group heading",
      "description": "string or null",
      "fields": [
        {
          "fieldId": "string or null - PDF form field ID/name if interactive",
          "label": "string - the question or field label",
          "type": "short_text | long_text | email | phone | number | date | single_choice | multiple_choice | dropdown | checkbox | file_upload | signature | unknown",
          "options": ["array of choice options, if applicable"],
          "required": true/false,
          "placeholder": "string or null",
          "notes": "string or null - validation hints, formatting requirements, etc."
        }
      ]
    }
  ],
  "notes": "string or null - general observations about the form"
}
\`\`\`

**Guidelines**:
- Group fields into logical sections based on headings, visual grouping, or thematic similarity — NOT based on physical page breaks. A section may span multiple printed pages, or a single page may contain multiple sections.
- For choice fields (radio buttons, checkboxes, dropdowns), always extract the available options.
- Mark fields as required if there's an asterisk (*), "required" label, or other indicator.
- Use "short_text" for single-line text inputs, "long_text" for multi-line/paragraph areas.
- Use "email" or "phone" when the label or context clearly indicates that type.
- Use "checkbox" for single yes/no toggles. Use "multiple_choice" for multi-select question groups.
- Use "single_choice" for radio button groups. Use "dropdown" for select/combobox fields.
- Include any visible instructions or helper text in the section description or field notes.
- Respond ONLY with the JSON object, no additional text or markdown fencing.`;
