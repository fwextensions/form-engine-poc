# Form Engine

This package provides the core logic for rendering dynamic forms based on YAML schema definitions.


## Features

- Parses YAML form schemas.
- Renders the registered field types (text, email, password, tel, number, textarea, select, radiogroup, checkbox, date, file, addressValidation) plus `html` content blocks inside `form`/`page` layouts.
- Every component is registered once (`createComponent()` / `defineField()`); validation, the LLM prompt, the JSON Schema and the exporters are all derived from that registry.
- Supports multi-page and single-page form layouts.
- Handles basic field validation (e.g., required fields).
- Allows conditional display of form elements using JSON Logic.


## JSON Form Schema

This package generates a JSON Schema (draft 2020-12) for whole form documents from the component registry (`catalogToFormJsonSchema()`): every component type is a `$defs` entry and each layout component's `children` only admits the types it allows. The form-editor feeds the same schema to Monaco (`monaco-yaml`); VS Code can use the generated file with the YAML extension.


### Generating the Schema

The JSON schema is generated automatically as part of the build process. You can also generate it manually by running the following command from within the `packages/form-engine` directory:

```bash
npm run generate-schema
```

This command executes the `scripts/generate-form-schema.ts` script, which outputs the schema to `packages/form-engine/dist/form-schema.json`.


### Using the Schema in VS Code

To enable schema validation and autocompletion for your YAML form files in Visual Studio Code:

1.  **Install the YAML Extension**: If you haven't already, install the [YAML extension by Red Hat](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml).

2.  **Configure VS Code Settings**: Create or update your workspace's `.vscode/settings.json` file to associate your YAML form files with the generated schema. Add the following configuration, adjusting paths as necessary:

    ```json
    {
      "yaml.schemas": {
        "./packages/form-engine/dist/form-schema.json": [
          // Add patterns for your YAML form definition files
          // For example, if your forms are in a 'schemas' directory at the root:
          "schemas/**/*.yaml",
          // Or for test schemas in form-engine:
          "packages/form-engine/test-schemas/**/*.yaml"
        ]
      }
    }
    ```

    *   Ensure the path to `form-schema.json` is correct relative to your workspace root.
    *   Modify the file patterns (e.g., `"schemas/**/*.yaml"`) to match the location(s) of your YAML form definition files.

Once configured, VS Code will use this schema to provide intellisense and diagnostics as you edit your YAML forms.
