# Form Engine - Proof of Concept

This project is a proof-of-concept for a schema-driven dynamic form engine. It's designed to parse form definitions written in YAML and render them as interactive, multi-step web forms using React.


## Core Features

*   **Schema-Driven:** Forms are defined declaratively in YAML files.
*   **Component-Based Rendering:** A flexible `ComponentRenderer` dynamically renders various UI elements based on the schema.
*   **Supported Elements:**
    *   Standard input fields: Text, Email, Select, Checkbox, Radio, Date, Textarea.
    *   Static HTML content for instructions, titles, or rich text.
*   **Multi-Step Forms:** Supports `multipage` display mode with navigation (Next/Previous) and validation per page.
*   **Dynamic Rules Engine:** A powerful rules engine allows for creating dynamic form behaviors. Rules, defined in the schema, can conditionally modify component properties (e.g., making a field visible, changing a label) based on user input (`formData`) or external data (`context`). The engine currently supports `set` actions (to change props) and `log` actions (for debugging).
*   **Automatic Field Preprocessing:** A transformation pipeline preprocesses component configurations. A common transform is included that automatically marks fields as required (`validation.required = true`) if their label ends with an asterisk (`*`), simplifying schema definitions.
*   **Context Propagation:** The `context` object is systematically passed down to all components, making it available for complex conditional rules.
*   **Zod-Based Validation:** Leverages Zod for robust schema validation, ensuring data integrity.


## Project Structure

This project is a monorepo managed with `npm` workspaces. It consists of the following packages:

*   `packages/form-engine`:
    *   The core library responsible for rendering schemas into dynamic forms.
    *   `core`: Contains the main `FormEngine`, `DynamicRenderer`, and other core rendering logic.
    *   `components`: Contains all standard form field components (e.g., Text, Select, DatePicker).
    *   `schema`: Defines the Zod schemas for validation and type safety.
    *   `hooks`: Includes custom hooks, such as `useFormRules` for the conditional logic engine.
    *   `services`: Provides services for schema parsing (`schemaParser.ts`) and component creation (`componentFactory.ts`).
*   `packages/form-editor`:
    *   A Next.js application for visually building and editing form schemas.
*   `packages/form-preview`:
    *   A Vite-based application for previewing forms as they are being built.
*   `packages/schema-viewer`:
    *   A Next.js application that serves as a demonstration and testing environment.
    *   It loads YAML schemas and uses the `form-engine` to render them.


## Key Technologies

*   **Frontend:** React (with Next.js for `schema-viewer`)
*   **Language:** TypeScript
*   **Schema Definition:** YAML (parsed with `js-yaml`)
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


### Running the Form Editor

1.  From the project root, run the `form-editor` development server:
    ```bash
    npm run dev
    ```
2.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the editor.


## Schema Overview

The form schema is defined in YAML and validated against a robust Zod schema. It defines the structure, content, and behavior of the form.

Key aspects include:

*   **Hierarchical Structure:** The schema is a tree of components. Typically, a root component contains `page` components in its `children` array for multi-step forms. Each `page` then contains its own `children`.
*   **Component Properties:** Every component has a `type` and an optional `id`. Fields extend this with properties like `label`, `description`, `disabled`, and `hidden`.
*   **Dynamic Rules Engine:** Component behavior can be controlled dynamically using the `rules` property.
    *   A `rule` consists of a `when` condition and a `then` block with one or more actions.
    *   **Condition (`when`):** Triggers the rule when a specified `field`'s value `is` a certain value (e.g., `{ when: { field: "someField", is: true } }`).
    *   **Actions (`then`):** An array of actions to execute. Currently supports `set` (to dynamically change component properties) and `log` (for debugging).
*   **Validation:** Fields can have a `validation` object. The `required` property can be set automatically by adding an asterisk (`*`) to a field's `label`.

An example schema can be found at `packages/form-preview/schema.yaml`.


## Future Development

Refer to the `docs` directory in the project root for files containing details of features, milestones, and planned enhancements.
