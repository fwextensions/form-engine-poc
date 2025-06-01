# Form Schema Editor Specification

This document outlines the plan for creating a YAML editor for form schemas using the Monaco Editor library. This editor will be a separate application within the monorepo, named `schema-editor`.

## Goals

- Provide a rich editing experience for YAML-based form schemas.
- Offer real-time schema validation and autocompletion.
- Integrate seamlessly into the existing monorepo structure and leverage the `form-engine` package for schema definitions.

## Technology Stack

- **Frontend Framework:** Next.js (App Router)
- **Language:** TypeScript
- **UI Library (Editor):** Monaco Editor
- **Styling:** Tailwind CSS
- **Schema Definition:** Zod (from `form-engine` package), converted to JSON Schema for Monaco

## Development Phases

### Phase 1: Project Setup & Monaco Integration

1.  **Create New Package `schema-editor`:**
    *   In the `packages` directory, create a new folder named `schema-editor`.
    *   Initialize a new Next.js application (App Router, TypeScript, Tailwind CSS, `src` directory) within `packages/schema-editor`.
    *   Update the root `package.json`'s `workspaces` array to include `"packages/schema-editor"`.
    *   Set up `tsconfig.json` for this new package, potentially extending a base `tsconfig.base.json` from the root.

2.  **Install Monaco Editor Dependencies:**
    *   In the `packages/schema-editor` package, install `monaco-editor`.
    *   Install and configure a webpack plugin (e.g., `monaco-editor-webpack-plugin`) or use Next.js's built-in capabilities to correctly bundle Monaco's assets. This will involve modifications to `next.config.js` in `schema-editor`.

3.  **Basic Editor Component (`YamlEditor.tsx`):**
    *   Create a React component (`src/components/YamlEditor.tsx`) within `schema-editor`.
    *   This component will:
        *   Use a `div` element to host the Monaco editor.
        *   Initialize the Monaco editor instance via `useEffect` on component mount.
        *   Configure the editor with basic options:
            *   `value`: (Initial YAML content, passed as a prop)
            *   `language`: `"yaml"`
            *   `theme`: (e.g., `"vs-dark"` or a custom theme)
        *   Expose an `onChange` prop that fires with the new content when the editor's content changes.
        *   Handle editor disposal in the `useEffect` cleanup function.

4.  **Integrate into a Page:**
    *   Create a main page in `schema-editor` (e.g., `src/app/page.tsx`).
    *   Import and render the `YamlEditor` component.
    *   Manage the YAML content state within this page component and pass it to/from the `YamlEditor`.

### Phase 2: Schema Intelligence & Features

5.  **YAML Syntax Highlighting & Basic Features:**
    *   Leverage Monaco Editor's built-in YAML syntax highlighting (activated by setting `language: "yaml"`).
    *   Ensure basic editor features (find/replace, undo/redo) are functional.

6.  **Schema Validation (Leveraging `form-engine`):**
    *   **Objective:** Provide real-time validation feedback in the editor based on Zod schemas from the `form-engine` package.
    *   **Implementation Steps:**
        1.  **Convert Zod to JSON Schema:** In the `form-engine` package (or a shared utility), create functions to convert Zod schemas (e.g., `FormComponentDefinition`, `FormPageDefinition`, `FormSchema`) into JSON Schema definitions. The `zod-to-json-schema` library is recommended for this.
        2.  **Configure Monaco YAML:** Utilize `monaco-yaml` (a library enhancing Monaco's YAML support) or Monaco's native JSON schema validation capabilities. Configure it to use the generated JSON Schemas for the YAML language. This will enable:
            *   Validation against form schema rules.
            *   Display of syntax errors and warnings directly in the editor (e.g., in the gutter, via hovers).
    *   The `schema-editor` will need to import these schema definitions or the conversion utility from the `form-engine` package.

7.  **Autocompletion:**
    *   Configure `monaco-yaml` (or equivalent) with the JSON Schemas to provide autocompletion for properties, values, and structure defined in your form schemas.

### Phase 3: Application UI & Workflow

8.  **File Operations:**
    *   Implement UI elements and logic for:
        *   **Loading Schemas:** Options to paste YAML directly, upload a `.yaml` file, or select from a predefined list of example/template schemas.
        *   **Saving Schemas:** Option to download the current editor content as a `.yaml` file.
    *   Consider future enhancements for more persistent storage or integration with a backend if needed.

9.  **User Interface (UI) / User Experience (UX):**
    *   Design a clean, intuitive, and user-friendly interface around the editor.
    *   Include a dedicated section or clear visual cues to display any validation errors or messages if they are not fully integrated into the editor's gutter/hover messages.
    *   Use Tailwind CSS for styling, maintaining consistency with the `schema-viewer` application.

10. **Preview Functionality (Core Feature):**
    *   **Concept:** Implement a live preview pane that dynamically renders the form based on the YAML content in the editor. This is a primary feature, allowing users to see the direct impact of their schema changes in real-time or near real-time.
    *   **Implementation:** This will involve taking the current YAML from the editor, parsing it using `form-engine`'s `parseFormSchema` function, and then rendering the form using the React components from the `form-engine` package. This requires `schema-editor` to have access to and be able to utilize these rendering components.

## Monorepo Considerations

*   **Dependency Management:** Ensure proper inter-package dependencies are defined (e.g., `schema-editor` depending on `form-engine` for schema definitions and potentially rendering components).
*   **Build Scripts:** Update root `package.json` scripts to include building, linting, and testing the new `schema-editor` package.
*   **Shared Utilities:** Identify any logic (like Zod to JSON Schema conversion) that could be placed in a shared utility package within the monorepo if it's beneficial for other future packages.
