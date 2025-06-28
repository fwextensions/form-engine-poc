# Form Editor & Live Preview Specification

## 1. Overview

This document outlines the plan to build a form editor with a live preview feature. The goal is to create a development tool within the existing monorepo that allows developers to write and edit a form schema in YAML and see a real-time preview of the rendered form. This will significantly improve the feedback loop and speed of form development.

The editor will be a new package, `form-editor`, built as a Next.js application. It will leverage the existing `form-engine` package for rendering and validation logic.

## 2. User Interface

The UI will consist of a two-pane, vertical layout:

-   **Left Pane (YAML Editor):** A full-featured code editor for writing and editing the form schema in YAML format. It will include syntax highlighting and line numbers.
-   **Right Pane (Form Preview):** A live, interactive preview of the form that updates in real-time as the user types in the editor.

The panes will be resizable to allow the user to adjust the view to their preference.

  <!-- Placeholder for a visual mockup -->

## 3. Architecture & Implementation Steps

### Step 1: Create the `form-editor` Package

1.  **Create Directory:** A new directory will be created at `packages/form-editor`.
2.  **Initialize Next.js App:** A new Next.js application will be scaffolded inside this directory.
3.  **Configure `package.json`:**
    -   Set the package name (e.g., `@form-engine/editor`).
    -   Add dependencies:
        -   `react`, `react-dom`, `next`
        -   `@form-engine/core` (or the name of your core form package) to access rendering logic and Zod schemas.
        -   `js-yaml` for parsing the YAML input.
        -   `@monaco-editor/react` for the code editor component.
        -   `react-resizable-panels` for the split-pane layout.
4.  **Configure `tsconfig.json`:** Set up TypeScript configuration to align with the monorepo's standards, including path aliases.

### Step 2: Build the Editor Page Component

1.  **Create Main Page:** The main component will be located at `packages/form-editor/src/app/page.tsx`.
2.  **State Management:** Use React's `useState` hook to manage:
    -   `yamlInput` (string): Stores the raw YAML string from the editor.
    -   `formConfig` (object | null): Stores the parsed and validated form schema object.
    -   `error` (string): Stores any YAML parsing or Zod validation error messages.
3.  **Layout:** Implement the resizable two-pane layout using `react-resizable-panels`.

### Step 3: Implement the Data Flow and Real-Time Updates

1.  **Editor Integration:**
    -   The left pane will contain the `<Editor>` component from `@monaco-editor/react`.
    -   The editor's `onChange` event will update the `yamlInput` state.
2.  **Parsing and Validation:**
    -   A `useEffect` hook will listen for changes to the `yamlInput` state.
    -   Inside the hook, the following will occur on every change:
        a.  **Parse YAML:** Use `js-yaml.load()` to parse the `yamlInput` string. Wrap this in a `try...catch` block to handle syntax errors.
        b.  **Validate with Zod:** If parsing is successful, use the exported Zod schema from the `form-engine` package to validate the resulting object (`formSchema.safeParse(parsedData)`).
        c.  **Update State:**
            -   On successful validation, update `formConfig` with the validated data and clear any previous `error`.
            -   On validation failure, update the `error` state with the formatted Zod error message.
            -   On YAML parsing failure, update the `error` state with the caught error message.
3.  **Live Preview Rendering:**
    -   The right pane will conditionally render the form or an error message:
        -   If `error` is present, display it in a formatted `<pre>` tag.
        -   If `formConfig` is valid, pass it as a prop to the main `<Form>` component from the `form-engine` package.

## 4. Error Handling

Robust error handling is critical for a good user experience. The editor will provide clear, immediate feedback for two types of errors:

-   **YAML Syntax Errors:** Reported by `js-yaml` (e.g., incorrect indentation).
-   **Schema Validation Errors:** Reported by Zod (e.g., missing required properties, incorrect data types).

Errors will be displayed prominently, ideally near the preview pane, to help the user quickly identify and fix issues in their schema.
