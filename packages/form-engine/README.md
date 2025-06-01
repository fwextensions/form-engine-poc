# Form Engine

This package provides the core logic for rendering dynamic forms based on YAML schema definitions.


## Features

- Parses YAML form schemas.
- Renders various field types (text, select, checkbox, radio, date, textarea).
- Supports multi-page and single-page form layouts.
- Handles basic field validation (e.g., required fields).
- Allows conditional display of form elements using JSON Logic.


## JSON Form Schema

This package includes the ability to generate a JSON schema from its internal Zod type definitions. This JSON schema can be used by editors (like VS Code with the YAML extension) to provide real-time validation and autocompletion for your YAML form definition files.


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
          // Or for specific files in the schema-viewer package:
          "packages/schema-viewer/src/schemas/**/*.yaml",
          // Or if you have a specific file you're working on:
          "poc-simple-form.yaml"
        ]
      }
    }
    ```

    *   Ensure the path to `form-schema.json` is correct relative to your workspace root.
    *   Modify the file patterns (e.g., `"schemas/**/*.yaml"`) to match the location(s) of your YAML form definition files.

Once configured, VS Code will use this schema to provide intellisense and diagnostics as you edit your YAML forms.
