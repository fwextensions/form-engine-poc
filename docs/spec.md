## Proof of Concept (PoC) Specification: Dynamic Form Engine

**PoC Objective:** To demonstrate the core feasibility of a schema-driven form engine capable of parsing a YAML definition and rendering an interactive, multi-step form using React and Radix UI, including basic field types, validation, and conditional logic.

**Key Technologies for PoC:**
*   **Frontend Framework:** React 19 (using Next.js 15 app router)
*   **UI Component Library:** Radix UI primitives
*   **Schema Language:** YAML with Zod validation
*   **YAML Parsing:** `js-yaml` library
*   **State Management:** React Context API with FormEngine component managing state
*   **Language:** TypeScript with strict type safety
*   **Build System:** npm workspaces monorepo with 4 packages
*   **Styling:** Tailwind CSS

---

### Pre-Milestone: Setup

*   **Task 0.1:** Initialize npm workspace monorepo with 4 packages. - [x] Done
*   **Task 0.2:** Install necessary dependencies: `radix-ui`, `js-yaml`, `@types/js-yaml`, `zod`. - [x] Done
*   **Task 0.3:** Establish monorepo structure with form-engine core library and demo applications. - [x] Done
*   **Task 0.4:** Implement component factory pattern with `createComponent()` registration system. - [x] Done

---

### Milestone 1: Basic YAML Schema Definition & Single Field Rendering

**Goal:** Define a minimal YAML schema for a single form field and render it using a corresponding Radix UI component. - [x] Done

*   **Task 1.1: Define Initial YAML Schema (v0.1 - Fields):** - [x] Done
    *   Propose a YAML structure for a `form` containing a list of `fields`.
    *   Each `field` should have at least:
        *   `id`: (string, unique identifier for the field)
        *   `type`: (string, e.g., "text", "email", "password")
        *   `label`: (string, display label for the field)
        *   `placeholder`: (optional string)
    *   *Example YAML Snippet:*
        ```yaml
        formName: PoC Simple Form
        fields:
          - id: userEmail
            type: email
            label: Your Email Address
            placeholder: "name@example.com"
        ```
*   **Task 1.2: Schema Parsing Service:** - [x] Done
    *   Create a simple service/function that takes a YAML string as input.
    *   Uses `js-yaml` to parse it into a JavaScript object.
    *   Basic error handling if YAML is invalid.
*   **Task 1.3: Field Renderer Component:** - [x] Done
    *   Create a React component (e.g., `FormFieldRenderer`) that takes a single parsed field object (from Task 1.1) as a prop.
    *   Based on the `field.type`, it should render the appropriate Radix UI component.
        *   Start with `type: "text"` and `type: "email"` rendering a Radix UI `TextField.Root` and `TextField.Input` (or simply `input type="text/email"` styled with Radix `Form.Field`, `Form.Label`, `Form.Control`).
        *   *LLM Prompt Example:* "Generate a React component using Radix UI's Form primitives that renders a label and an input field. The component should accept props for `id`, `label`, `type`, and `placeholder`."
*   **Task 1.4: Form Rendering Component:** - [x] Done
    *   Create a React component (e.g., `SchemaForm`) that:
        *   Takes a parsed form schema object as a prop.
        *   Iterates over the `fields` array.
        *   For each field, uses the `FormFieldRenderer` to render it.
*   **Task 1.5: Basic App Integration:** - [x] Done
    *   Load a sample YAML file (or string) in the main `App` component.
    *   Parse it using the service from Task 1.2.
    *   Pass the parsed schema to the `SchemaForm` component to display the single field.

**Deliverable for M1:** A webpage displaying a single form field (e.g., an email input) rendered from a YAML definition, using Radix UI components. - [x] Done

---

### Milestone 2: Expanding Field Types & Basic Validation

**Goal:** Support more standard field types and implement basic "required" field validation. - [x] Done

*   **Task 2.1: Expand YAML Schema (v0.2 - More Field Types & Validation):** - [x] Done
    *   Add support for more `type` values: `select`, `checkbox`, `radio`, `date`, `textarea`.
    *   For `select` and `radio`, define how `options` (value, label pairs) are specified in the YAML.
    *   Add a `validation` property to fields, initially supporting:
        *   `required`: (boolean). (Note: Also implemented shorthand where label ending with `*` sets `required: true`)
    *   *Example YAML Snippet (addition for select and validation):*
        ```yaml
        fields:
          # ... existing fields
          - id: favoriteColor
            type: select
            label: Favorite Color
            options:
              - value: "red"
                label: "Red"
              - value: "blue"
                label: "Blue"
            validation:
              required: true
        ```
*   **Task 2.2: Enhance Field Renderer Component:** - [x] Done
    *   Update `FormFieldRenderer` to handle the new field types, mapping them to appropriate Radix UI components:
        *   `select`: Radix UI `Select.Root`, `Select.Trigger`, `Select.Content`, `Select.Item`.
        *   `checkbox`: Radix UI `Checkbox.Root`.
        *   `radio`: Radix UI `RadioGroup.Root`, `RadioGroup.Item`.
        *   `date`: `<input type="date">` (can be styled with Radix Form primitives).
        *   `textarea`: `<textarea>` (can be styled with Radix Form primitives).
*   **Task 2.3: Implement Basic State Management & Validation Logic:** - [x] Done
    *   Within `SchemaForm` (or a new parent component), manage the form's data state (values of each field). Use `useState` for this PoC.
    *   On form submission attempt (add a basic submit button):
        *   Iterate through fields defined as `required`.
        *   If a required field is empty, display a simple error message next to the field (Radix `Form.Message` can be used here).
        *   Prevent submission if validation fails.
*   **Task 2.4: Data Collection on Submit:** - [x] Done
    *   If validation passes, collect all form field values into a simple JSON object and `console.log` it.

**Deliverable for M2:** A webpage displaying a form with multiple field types (text, select, checkbox, radio, date, textarea) rendered from YAML. Basic "required" validation should prevent submission and show error messages. Submitted data (if valid) is logged to the console. - [x] Done

---

### Milestone 3: Multi-Step Navigation & Schema Refactor

**Goal:** Implement support for defining and navigating multi-step forms, evolving to a generic page-based schema. - [x] Done (Evolved from initial `steps` array to generic `page` components)

*   **Task 3.1: Update YAML Schema (v0.3 - Pages & Generic Children):** - [x] Done
    *   Refactor schema from a `steps` array to a top-level `children` array where each child is a component (e.g., `type: "page"`).
    *   Each `page` component has an `id`, optional `title`, and its own `children` array for fields.
    *   Add `display` property to schema (e.g., `multipage`, `singlepage`).
    *   *Example YAML Snippet (Conceptual - actual implementation uses `page` type):*
        ```yaml
        formName: PoC Multi-Page Form
        display: multipage
        children:
          - id: page1
            type: page
            title: Personal Information
            children:
              - id: fullName
                type: text
                label: Full Name
                validation: { required: true }
          - id: page2
            type: page
            title: Preferences
            children:
              - id: favoriteColor # (as defined in M2)
                # ...
        ```
*   **Task 3.2: Enhance Form Rendering Logic (`SchemaForm`):** - [x] Done
    *   Update `SchemaForm` to manage `currentPageIndex` based on `multipage` display mode.
    *   Render only the components (fields/content) of the current page.
    *   Implement `ComponentRenderer` to recursively render components.
*   **Task 3.3: Navigation Controls:** - [x] Done
    *   Add "Next" and "Previous" buttons for `multipage` forms.
    *   "Next" button triggers validation for fields on the current page.
    *   If valid, advances to the next page.
    *   On the last page, it becomes a "Submit" button.
    *   "Previous" button moves to the previous page.
*   **Task 3.4: Progress Indication (Optional but good for PoC):** - [ ] To Do (Low priority for now)
    *   Display a simple progress indicator (e.g., "Page 1 of 3" or dots representing pages).
*   **Task 3.5: Preserve Field Values Across Steps/Pages:** - [x] Done (Handled by lifting state in `SchemaForm`)

**Deliverable for M3:** A multi-step form rendered from YAML, allowing users to navigate between pages with validation on "Next." Field values are preserved. Schema supports generic page/component structure. - [x] Done

---

### Milestone 4: Conditional Rules via Centralized Prop Merging - [x] Done

**Goal:** Implement a flexible rules engine that dynamically updates component properties (like `hidden`, `required`, `label`, `disabled`) based on form data. The implementation will use a centralized prop merging strategy to keep field components simple.

**Status:** ✅ **COMPLETED** - Fully implemented with `useFormRules` hook and integrated into FormEngine.

*   **Task 4.1: Update YAML Schema (v0.4 - `rules` block):** - [x] Done
    *   Introduce a new optional `rules` property on components. This property will be an array of individual `rule` objects.
    *   Each rule has a `when` clause (the condition) and a `then` clause (the effects).
    *   The `when` clause defines the condition (e.g., based on a field's value).
    *   The `then` clause is an array of action objects. Each object has a single key that defines the action type (e.g., `set`, `log`), and the value contains the parameters for that action.
    *   *Example YAML Snippet:*
        ```yaml
        - id: isApplying
          type: checkbox
          label: "Are you applying for the program?"
        - id: reasonForApplying
          type: textarea
          label: "Reason for applying"
          rules:
            - when:
                field: isApplying
                is: true
              then:
                - set:
                    required: true
                    label: "Please explain why you are applying"
                - log:
                    - "User is applying, reason field is now required."
        ```

*   **Task 4.2: Create the Rules Engine (`useFormRules` hook):** - [x] Done
    *   Implement a new React hook, `useFormRules(schema, formData)`.
    *   This hook will be the brain of the system. On every render (i.e., whenever `formData` changes), it will:
        1.  Iterate through all fields in the `schema` that have a `rules` block.
        2.  For each field, evaluate its rules against the current `formData`.
        3.  Process the `then` clause for any triggered rules, accumulating property changes from `set` actions.
        4.  Build and return an object mapping field names to their calculated dynamic properties.
        *   *Example output:* `{ "reasonForApplying": { "required": true, "label": "Please explain..." } }`

*   **Task 4.3: Integrate Rules Engine into Form Renderer:** - [x] Done
    *   In the main form rendering component (`FormRenderer` or similar), call the `useFormRules` hook to get the dynamic properties.
    *   In the loop that renders the form fields, merge the static props from the schema with the dynamic props from the rules engine. The dynamic props should take precedence.
    *   *Example Integration:*
        ```tsx
        const dynamicPropsByField = useFormRules(schema, formData);
        // ... inside render loop for each fieldConfig ...
        const dynamicProps = dynamicPropsByField[fieldConfig.name] || {};
        const finalProps = { ...fieldConfig, ...dynamicProps };
        // Pass finalProps to the componentFactory
        ```

*   **Task 4.4: Ensure Component Compliance:** - [x] Done
    *   Verify that field components (`Text`, `Select`, etc.) correctly use the props that can be dynamically changed (e.g., `hidden`, `required`, `disabled`, `label`).
    *   Since the props are merged centrally, no changes should be needed inside the components themselves, but this is a verification step. A component should correctly hide itself if it receives `hidden: true`.

**Deliverable for M4:** ✅ **COMPLETED** - A form where component properties are dynamically updated based on user input in other fields. The logic is defined in a concise and powerful `rules` format in the YAML schema and executed by the `useFormRules` hook integrated into the FormEngine component.

**Implementation Details:**
- Rules engine implemented in `packages/form-engine/src/hooks/useFormRules.ts`
- Supports `when`/`then` conditional logic with `set` and `log` actions
- Dynamic props merged centrally in `DynamicRenderer` component
- Fully integrated with FormEngine's context system

---

### Milestone 5: Enhanced Content & Presentation - [x] Partially Done

**Goal:** Improve form presentation with static HTML content, field descriptions, and visual grouping of fields.

**Status:** 🔄 **PARTIALLY COMPLETED** - HTML component implemented, other features pending.

*   **Task 5.1: Implement `html` Component Type:** - [x] Done
    *   Define an `html` component type in the schema that accepts a `content` property (string of HTML).
    *   Create a renderer for this component that safely renders the provided HTML (e.g., using `dangerouslySetInnerHTML` with appropriate sanitization if necessary, or a safer alternative).
    *   *Example YAML:*
        ```yaml
        - id: introText
          type: html
          content: "<p>Welcome to the form. Please read these instructions carefully.</p>"
        ```
*   **Task 5.2: Add `description` Property to Fields:**
    *   Allow a `description` string property in the schema for field components.
    *   Update field renderers to display this description text (e.g., below the label or input).
    *   *Example YAML:*
        ```yaml
        - id: userEmail
          type: email
          label: Your Email Address
          description: "We will never share your email with anyone else."
        ```
*   **Task 5.3: Implement Field Grouping / Section Headers:**
    *   Define a new component type (e.g., `sectionHeader` or `fieldGroup`) in the schema.
    *   This component could take a `title` or `text` property.
    *   Render it as a visual separator or heading within a page to group related fields.
    *   *Example YAML (conceptual):*
        ```yaml
        children: # (within a page)
          - type: sectionHeader
            title: "Personal Details"
          - id: firstName
            # ...
          - id: lastName
            # ...
          - type: sectionHeader
            title: "Contact Information"
          - id: email
            # ...
        ```

**Deliverable for M5:** ✅ **HTML Component Done** - Forms can include static HTML blocks via the `html` component type. Field descriptions and section headers still pending implementation.

**Implementation Details:**
- HTML component implemented in `packages/form-engine/src/components/layout/Html.tsx`
- Safely renders static HTML content within forms
- Registered via component factory pattern

---

### Milestone 6: Advanced Field Types & Interactions

**Goal:** Introduce more complex field types and dynamic interactions within the form.

*   **Task 6.1: Composite Date Input / Enhanced Date Handling:**
    *   Design and implement a better user experience for date input.
    *   Options: A composite field type (`dateParts` with sub-fields for MM, DD, YYYY) or enhance the existing `date` type to use a more robust date picker component (if Radix doesn't offer one, a lightweight external one or custom build).
    *   Ensure proper validation and data formatting.
*   **Task 6.2: Field Repeater / Dynamic Lists:**
    *   Define schema support for repeating groups of fields (e.g., "add another phone number", "add household member").
    *   This might involve a `repeater` component type that takes a `template` of fields and allows users to add/remove instances.
    *   Manage state for these dynamic lists.
*   **Task 6.3: Dynamic Text Injection:**
    *   Allow schema authors to inject form data into text elements like page titles, field labels, or descriptions (e.g., `title: "Thanks, {{formData.firstName}}!"`).
    *   Implement a simple templating mechanism in the rendering logic.

**Deliverable for M6:** Forms can include improved date inputs, allow users to dynamically add sets of fields (repeaters), and display dynamic text based on other form data.

---

### Milestone 7: Form Review & Submission Enhancements

**Goal:** Provide a way to review all entered data before final submission and enhance data handling.

*   **Task 7.1: Implement `summary` / `review` Page/Component Type:**
    *   Define a component type (e.g., `reviewPage` or a `summaryDisplay` component) that can be placed typically as the last step of a multi-page form.
    *   This component should iterate through all (or specified) form fields and their current values, displaying them in a read-only format.
    *   Consider allowing simple formatting or sectioning in the review.
*   **Task 7.2: Data Transformation/Mapping on Submit (Optional for PoC):**
    *   Explore schema options to define how form data should be structured or transformed before being submitted (e.g., renaming keys, nesting data).

**Deliverable for M7:** Forms can include a dedicated review step showing all user-entered data. Basic data collection for submission is robust.

---

### Stretch Goals / Future Considerations

*   **SG1: "Save and Finish Later" Functionality:**
    *   Implement a mechanism to save the current form state (e.g., to `localStorage` or a backend) and allow users to resume later.
*   **SG2: Advanced Validation Rules:**
    *   Support for more complex validation: regex patterns, min/max values/lengths, cross-field validation, custom validation functions defined in schema or via plugins.
*   **SG3: Internationalization (i18n) & Localization (l10n):**
    *   Schema support for multiple languages for labels, messages, etc.
*   **SG4: Accessibility (A11y) Enhancements:**
    *   Beyond Radix UI defaults, conduct specific A11y testing and implement improvements for ARIA attributes, keyboard navigation, etc.
*   **SG5: Theming and Styling Hooks:**
    *   Provide clearer ways for consuming applications to customize the look and feel beyond basic Tailwind usage.
*   **SG6: File Upload Component:**
    *   Support for `type: file` with options for validation (size, type) and handling uploads.
*   **SG7: Integration with External Data Sources:**
    *   Ability to populate select options or pre-fill fields from an API.
*   **SG8: Extensibility / Plugin Architecture:**
    *   Allow developers to register custom field types or validation logic.

---

## Current Implementation Status

### ✅ **COMPLETED MILESTONES:**
- **M1-M4:** Core functionality fully implemented
- **Component Factory System:** Advanced registration pattern with Zod validation
- **Rules Engine:** Dynamic conditional logic with `useFormRules` hook
- **Multi-page Navigation:** Full support with controlled/uncontrolled modes
- **Field Types:** Text, Select, Checkbox, Radio, Date, Textarea, File components
- **HTML Content:** Static HTML blocks for instructions and content

### 📦 **MONOREPO ARCHITECTURE:**
- **form-engine:** Core rendering library with factory pattern
- **form-editor:** Monaco editor with live preview (Next.js)
- **form-preview:** Standalone Vite application for testing
- **schema-viewer:** Demo application with sample schemas

### 🎯 **ADVANCED FEATURES IMPLEMENTED:**
- **FormEngine Component:** Imperative API with React.forwardRef
- **Dynamic Rendering:** Recursive component rendering with prop merging
- **Context System:** FormEngineContext for state management
- **JSON Schema Generation:** Automated schema generation from Zod definitions
- **TypeScript Integration:** Full type safety throughout

---

**PoC Success Criteria:**
✅ **ACHIEVED** - All core milestones (1-4) are completed with advanced architecture.
✅ **ACHIEVED** - The form engine successfully renders complex, multi-page forms from YAML schemas.
✅ **ACHIEVED** - Codebase is well-structured with factory pattern, hooks, and TypeScript.
✅ **ACHIEVED** - PoC demonstrates the full potential of schema-driven forms with conditional logic.

**Additional Achievements Beyond Original Scope:**
- Monorepo architecture for better code organization
- Advanced component registration system
- Live schema editing with Monaco integration
- Imperative API for external form control
- JSON schema generation for tooling integration
