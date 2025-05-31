# Dynamic Form Engine - Proof of Concept

This project is a proof-of-concept for a schema-driven dynamic form engine. It's designed to parse form definitions written in YAML and render them as interactive, multi-step web forms using React.

## Core Features

*   **Schema-Driven:** Forms are defined declaratively in YAML files.
*   **Component-Based Rendering:** A flexible `ComponentRenderer` dynamically renders various UI elements based on the schema.
*   **Supported Elements:**
    *   Standard input fields: Text, Email, Select, Checkbox, Radio, Date, Textarea.
    *   Static HTML content for instructions, titles, or rich text.
*   **Multi-Step Forms:** Supports `multipage` display mode with navigation (Next/Previous) and validation per page.
*   **Conditional Logic:** Powerful conditional rendering of any component using [JSON Logic](https://jsonlogic.com/). Conditions can be based on:
    *   `formData`: Current values of other fields in the form.
    *   `context`: An external data object passed into the form (e.g., user details, application state).
*   **Context Propagation:** The `context` object is systematically passed down to all components, making it available for complex conditional rules.
*   **Basic Validation:** Supports "required" field validation.

## Project Structure

This project is a monorepo, likely intended to be managed with `npm` workspaces (though setup can be adapted). It consists of the following main packages:

*   `packages/form-engine`:
    *   The core engine library.
    *   Contains schema parsing logic (`schemaParser.ts`), component registration (`componentRegistry.ts`), the main `ComponentRenderer.tsx`, `PageRenderer.tsx`, and individual field/HTML components.
    *   Exports `PoCForm` as the primary component to render a form based on a schema.
*   `packages/schema-viewer`:
    *   A Next.js application that serves as a demonstration and testing environment for the `form-engine`.
    *   It loads YAML schemas (e.g., `poc-simple-form.yaml`) and uses the `PoCForm` component from the `form-engine` to render them.

## Key Technologies

*   **Frontend:** React (with Next.js for `schema-viewer`)
*   **Language:** TypeScript
*   **Schema Definition:** YAML (parsed with `js-yaml`)
*   **Conditional Logic:** JSON Logic (evaluated with `json-logic-js`)
*   **Styling:** Tailwind CSS (for `schema-viewer` and basic component styling)
*   **UI Primitives:** Radix UI, styled with Tailwind CSS

## Getting Started

### Prerequisites

*   Node.js (latest LTS version recommended)
*   `npm`

### Installation

1.  Clone the repository.
2.  Navigate to the project root directory (`form-engine`).
3.  Install dependencies using `npm`:
    ```bash
    npm install
    ```

### Running the Schema Viewer (Demo App)

1.  From the project root, run the `schema-viewer` development server:
    ```bash
    npm --filter schema-viewer dev
    ```
    Alternatively, navigate to the `schema-viewer` package and run its dev script:
    ```bash
    cd packages/schema-viewer
    npm dev
    ```
2.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the demo form.

## Schema Overview

The form schema is defined in YAML. Key aspects include:

*   A top-level `children` array, typically containing `page` components for multi-step forms.
*   Each `page` has its own `children` array defining fields or other content for that page.
*   Components (fields, HTML blocks, pages) have properties like `id`, `type`, `label`, and an optional `condition` for dynamic visibility.
*   The `condition` property uses JSON Logic syntax.

An example schema can be found at `packages/schema-viewer/src/schemas/poc-simple-form.yaml`.

## Future Development

Refer to `spec.md` in the project root for a detailed specification of features, milestones, and planned enhancements.
