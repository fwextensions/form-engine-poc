# Refactoring Specification: Component-Driven Form Engine

## Overall Goals
1.  **Decentralize Schema Definition & Validation:** Each form component (fields, pages, layout elements) will define its own configuration schema using Zod within its own `.tsx` file.
2.  **Auto-Registration:** Components will register themselves with a central registry upon import, triggered by their `createComponent` call.
3.  **Dynamic Rendering:** A `DynamicRenderer` will use the registry to find and render components based on the parsed form schema.
4.  **Simplify `schemaParser.ts`:** Reduce its role to primarily bootstrapping the parsing of the root form configuration.
5.  **Enhance Modularity & Extensibility:** Make it significantly easier to add, modify, or replace components, with each component's logic, schema, and presentation co-located.

---

## I. Core Infrastructure (`packages/form-engine/src/core/`)

This directory will house the foundational elements of the new component system.

1.  **`componentFactory.ts`**
    *   **`FormEngineContext` Type:**
        ```typescript
        export interface FormEngineContext {
            formData: Record<string, any>;
            onDataChange: (fieldName: string, value: any) => void;
            formContext?: Record<string, any>; // For JSONLogic, etc., passed into SchemaForm
            formMode?: "view" | "edit" | "print"; // Example modes
            // Potentially other global state or functions needed by components
        }
        ```
    *   **`ComponentDefinition<ConfigType, PropsType>` Interface:**
        ```typescript
        import { z } from "zod";
        import React from "react";

        export interface ComponentDefinition<ConfigType = any, PropsType = any> {
            type: string;
            schema: z.ZodSchema<ConfigType>; // Zod schema for the component's configuration
            component: React.ComponentType<PropsType & { children?: React.ReactNode }>; // The React component
            validateConfig: (data: unknown) => ConfigType; // Parses and validates the raw config data
            transformProps?: (
                parsedConfig: ConfigType,
                context: FormEngineContext,
                renderChildren: (childrenConfig: unknown[] | undefined, context: FormEngineContext) => React.ReactNode
            ) => PropsType; // Transforms validated config and context into React props
        }
        ```
    *   **`componentRegistry: Map<string, ComponentDefinition>`:**
        A global `Map` to store registered component definitions.
    *   **`createComponent<ConfigType extends object, PropsType extends object>(definitionArgs: { ... })` Function:**
        ```typescript
        export function createComponent<
            ConfigType extends { type: string; [key: string]: any },
            PropsType extends object
        >(args: {
            type: string;
            schema: z.ZodSchema<ConfigType>;
            component: React.ComponentType<PropsType & { children?: React.ReactNode }>;
            transformProps?: (
                parsedConfig: ConfigType,
                context: FormEngineContext,
                renderChildren: (childrenConfig: unknown[] | undefined, context: FormEngineContext) => React.ReactNode
            ) => PropsType;
        }): ComponentDefinition<ConfigType, PropsType> {
            const definition: ComponentDefinition<ConfigType, PropsType> = {
                type: args.type,
                schema: args.schema,
                component: args.component,
                validateConfig: (data: unknown) => {
                    if (typeof data === "object" && data && "type" in data && (data as any).type !== args.type) {
                        throw new z.ZodError([{
                            code: z.ZodIssueCode.custom,
                            path: ["type"],
                            message: `Expected component type "${args.type}" but received "${(data as any).type}"`,
                        }]);
                    }
                    return args.schema.parse(data) as ConfigType;
                },
                transformProps: args.transformProps,
            };
            componentRegistry.set(args.type, definition);
            return definition; // Though not strictly necessary to return, it can be useful
        }
        ```
    *   **`getComponentDefinition(type: string)` and `getAllComponentDefinitions()`:**
        Helper functions to access the `componentRegistry`.

2.  **`componentRegistryService.ts`**
    *   Responsible for ensuring all components are registered.
    *   Can use manual imports of all component `.tsx` files or implement automated registration.
    *   Re-exports `getComponentDefinition` and `getAllComponentDefinitions`.
    ```typescript
    // packages/form-engine/src/core/componentRegistryService.ts

    // Option 1: Manual imports (triggers createComponent calls within each component file)
    import "../components/fields/Text"; // e.g., imports Text.tsx
    import "../components/fields/Select";
    import "../components/layout/Page";
    import "../components/layout/Form";
    // ... import all other component definition modules (the .tsx files themselves)

    // Option 2: Automated registration (see section VII)
    // import "./autoRegister";

    export { getComponentDefinition, getAllComponentDefinitions } from "./componentFactory";
    ```

3.  **`DynamicRenderer.tsx`**
    *   Renders the form structure recursively based on component configurations.
    ```typescript
    // packages/form-engine/src/core/DynamicRenderer.tsx
    import React from "react";
    import { getComponentDefinition } from "./componentRegistryService";
    import { FormEngineContext } from "./componentFactory";
    import { evaluateCondition } from "../services/conditionLogic"; // Assumed service

    interface DynamicRendererProps {
        config: unknown;
        context: FormEngineContext;
        ErrorComponent?: React.ComponentType<{ error: string; componentType?: string }>;
    }

    const DefaultErrorComponent: React.FC<{ error: string; componentType?: string }> = ({ error, componentType }) => (
        <div style={{ color: "red", border: "1px solid red", padding: "8px", margin: "4px 0" }}>
            Error rendering {componentType ? `component "${componentType}"` : "component"}: {error}
        </div>
    );

    export const DynamicRenderer: React.FC<DynamicRendererProps> = ({
        config,
        context,
        ErrorComponent = DefaultErrorComponent,
    }) => {
        if (!config || typeof config !== "object" || !("type" in config) || typeof (config as any).type !== "string") {
            return <ErrorComponent error="Invalid component configuration: missing or invalid 'type'." />;
        }

        const componentType = (config as { type: string }).type;

        try {
            const componentDef = getComponentDefinition(componentType);
            if (!componentDef) {
                return <ErrorComponent error={`Unknown component type: ${componentType}`} componentType={componentType} />;
            }

            const validatedConfig = componentDef.validateConfig(config);

            if ("condition" in validatedConfig && validatedConfig.condition) {
                if (!evaluateCondition(validatedConfig.condition, context.formData, context.formContext)) {
                    return null;
                }
            }

            const ComponentToRender = componentDef.component;

            const renderChildren = (childrenConfig: unknown[] | undefined, currentContext: FormEngineContext): React.ReactNode => {
                return childrenConfig?.map((childConfig: unknown, index: number) => (
                    <DynamicRenderer key={index} config={childConfig} context={currentContext} ErrorComponent={ErrorComponent} />
                ));
            };

            let props;
            if (componentDef.transformProps) {
                props = componentDef.transformProps(validatedConfig, context, (childConfigsToRender, childContext) => renderChildren(childConfigsToRender, childContext || context));
            } else {
                props = (validatedConfig as any).props || validatedConfig;
            }

            let childrenElements: React.ReactNode = null;
            if (componentDef.transformProps) {
                // transformProps handles children rendering via renderChildren callback
            } else if ("children" in validatedConfig && Array.isArray(validatedConfig.children)) {
                childrenElements = renderChildren(validatedConfig.children, context);
            }

            return (
                <ComponentToRender {...props}>
                    {childrenElements && !componentDef.transformProps ? childrenElements : undefined}
                </ComponentToRender>
            );

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            return <ErrorComponent error={errorMessage} componentType={componentType} />;
        }
    };
    ```

---

## II. Base Schemas (`packages/form-engine/src/components/baseSchemas.ts`)

Common Zod schemas to be extended by specific components.

```typescript
// packages/form-engine/src/components/baseSchemas.ts
import { z } from "zod";

export const baseComponentConfigSchema = z.object({
    id: z.string().optional(),
    type: z.string(),
    condition: z.any().optional(),
});

export const baseFieldConfigSchemaProps = {
    id: z.string(),
    name: z.string().optional(),
    label: z.string(),
    validation: z.object({
        required: z.boolean().optional(),
    }).optional(),
};

export const asteriskToRequiredRefinement = (data: { label: string; validation?: { required?: boolean } }, ctx: z.RefinementCtx) => {
    if (data.label && data.label.trim().endsWith("*")) {
        data.label = data.label.replace(/\s*\*\s*$/, "").trim();
        if (!data.validation) {
            data.validation = {};
        }
        data.validation.required = true;
    }
};
```

---

## III. Component Definitions (`packages/form-engine/src/components/`)

Each component type (field, page, layout) will reside in its own `.tsx` file within a category subdirectory (e.g., `fields/`, `layout/`).

**Example: `Text` Component (`packages/form-engine/src/components/fields/Text.tsx`)**

This example demonstrates how a field component like `Text` would be structured, utilizing `FormFieldContainer` and Radix UI components, modeled after a typical existing `TextField.tsx`.

```typescript
// packages/form-engine/src/components/fields/Text.tsx
import React from "react";
import { z } from "zod";
import { createComponent, FormEngineContext } from "../../core/componentFactory";
import { baseComponentConfigSchema, baseFieldConfigSchemaProps, asteriskToRequiredRefinement } from "../baseSchemas";
import FormFieldContainer from "./FormFieldContainer"; // Assuming relative path
import { Control as RadixControl, Message as RadixMessage } from '@radix-ui/react-form'; // Radix UI imports
// Assume 'inputStyles' and 'messageStyles' are imported from a shared './styles.ts'
// import { inputStyles, messageStyles } from './styles';

// 1. Define Props for the Text component (output of transformProps)
export interface TextProps {
    // Props to construct the 'component' prop for FormFieldContainer
    containerProps: {
        id: string;
        label?: string;
        description?: string;
        className?: string; // For FormFieldContainer's root <Field> element (from config.className)
        style?: React.CSSProperties; // For FormFieldContainer's root <Field> element (from config.style)
        // FormFieldContainer also expects 'type' which we can add if needed, e.g., type: "text"
    };
    // Props for the actual RadixControl/input element
    inputProps: {
        id: string; // Should match containerProps.id for label htmlFor
        name: string; // HTML name attribute
        type: "text" | "email" | "password" | "tel" | "url" | "number" | "search";
        value: string;
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
        placeholder?: string;
        required?: boolean;
        disabled?: boolean;
        readOnly?: boolean;
        autoFocus?: boolean;
        tabIndex?: number;
        autoComplete?: string;
        className?: string; // For the <input> element itself (from config.inputClassName)
    };
    // Props for RadixMessage
    validationMessages?: {
        valueMissing?: string;
        // Potentially other Radix match types like 'typeMismatch', 'patternMismatch', etc.
    };
}

// 2. Define the React Component
export const Text: React.FC<TextProps> = ({ containerProps, inputProps, validationMessages }) => {
    // Construct the 'component' prop for FormFieldContainer based on its expected structure
    // This mapping assumes FormFieldContainer expects an object similar to the old 'FormField' type.
    const ffContainerComponentProp = {
        ...containerProps, // id, label, description, className, style
        type: "text", // Explicitly set or derive if FormFieldContainer uses it
        // Add any other properties FormFieldContainer's 'component' prop might expect from the original FormField type
    };

    return (
        <FormFieldContainer component={ffContainerComponentProp as any /* Cast for spec simplicity */}>
            <RadixControl asChild>
                <input
                    id={inputProps.id}
                    name={inputProps.name}
                    type={inputProps.type}
                    value={inputProps.value}
                    onChange={inputProps.onChange}
                    placeholder={inputProps.placeholder}
                    required={inputProps.required}
                    disabled={inputProps.disabled}
                    readOnly={inputProps.readOnly}
                    autoFocus={inputProps.autoFocus}
                    tabIndex={inputProps.tabIndex}
                    autoComplete={inputProps.autoComplete}
                    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${inputProps.className || ''}`}
                    // Example of combining default styles with configured inputClassName
                    // className={`${inputStyles} ${inputProps.className || ''}`}
                />
            </RadixControl>
            {validationMessages?.valueMissing && (
                <RadixMessage className="text-red-500 text-sm mt-1" name={inputProps.id} match="valueMissing">
                    {validationMessages.valueMissing}
                </RadixMessage>
            )}
            {/* Add other <RadixMessage> components for other validation types as needed */}
        </FormFieldContainer>
    );
};

// 3. Define the Zod Schema for the component's configuration in YAML/JSON
const validHtmlInputTypes = z.enum(['text', 'email', 'password', 'tel', 'url', 'number', 'search']);

export const TextConfigSchema = baseComponentConfigSchema // Provides id (optional), type, condition, className (for container), style (for container)
    .extend({
        type: z.literal("text"), // Narrows 'type' from baseComponentConfigSchema
        ...baseFieldConfigSchemaProps, // Adds required id, name (optional), label, description, validation (e.g. required)

        // Input-specific configurations
        inputType: validHtmlInputTypes.default('text').optional(),
        placeholder: z.string().optional(),
        defaultValue: z.string().optional(),
        disabled: z.boolean().optional(),
        readOnly: z.boolean().optional(),
        autoFocus: z.boolean().optional(),
        tabIndex: z.number().int().optional(),
        autoComplete: z.string().optional(),
        inputClassName: z.string().optional(), // For styling the <input> element itself

        // Configuration for validation messages
        validationMessages: z.object({
            valueMissing: z.string().optional(),
            // typeMismatch: z.string().optional(), // Example for other validation types
        }).optional(),
    })
    .superRefine(asteriskToRequiredRefinement); // Automatically handle '*' in labels for 'required'

export type TextConfig = z.infer<typeof TextConfigSchema>;

// 4. Register the component
createComponent<TextConfig, TextProps>({
    type: "text",
    schema: TextConfigSchema,
    component: Text,
    transformProps: (config: TextConfig, context: FormEngineContext): TextProps => {
        const fieldName = config.name || config.id; // 'id' from baseFieldConfigSchemaProps is required.
        const value = context.formData[fieldName] !== undefined ? String(context.formData[fieldName]) : (config.defaultValue || "");

        return {
            containerProps: {
                id: config.id,
                label: config.label,
                description: config.description,
                className: config.className, // For FormFieldContainer's wrapper
                style: config.style, // For FormFieldContainer's wrapper
            },
            inputProps: {
                id: config.id,
                name: fieldName,
                type: config.inputType || 'text',
                value: value,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => context.onDataChange(fieldName, event.target.value),
                placeholder: config.placeholder,
                required: config.validation?.required,
                disabled: config.disabled,
                readOnly: config.readOnly,
                autoFocus: config.autoFocus,
                tabIndex: config.tabIndex,
                autoComplete: config.autoComplete,
                className: config.inputClassName,
            },
            validationMessages: {
                valueMissing: config.validationMessages?.valueMissing || `${config.label || 'This field'} is required.`,
                // Map other messages if configured
            },
        };
    },
});

export default Text;
```

**Example: `Page` Component (`packages/form-engine/src/components/layout/Page.tsx`)**
```typescript
// packages/form-engine/src/components/layout/Page.tsx
import React from "react";
import { z } from "zod";
import { createComponent, FormEngineContext } from "../../core/componentFactory";
import { baseComponentConfigSchema } from "../baseSchemas";

export interface PageProps {
    id?: string;
    title?: string;
    children?: React.ReactNode;
}

export const Page: React.FC<PageProps> = ({ title, children }) => {
    return (
        <section className="form-page py-4">
            {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
            <div>{children}</div>
        </section>
    );
};

export const PageConfigSchema = baseComponentConfigSchema.extend({
    type: z.literal("page"),
    title: z.string().optional(),
    children: z.array(z.unknown()).optional(), // Configs for child components
});
export type PageConfig = z.infer<typeof PageConfigSchema>;

createComponent<PageConfig, PageProps>({
    type: "page",
    schema: PageConfigSchema,
    component: Page,
    transformProps: (config: PageConfig, context: FormEngineContext, renderChildren): PageProps => {
        return {
            id: config.id,
            title: config.title,
            children: config.children ? renderChildren(config.children, context) : undefined,
        };
    },
});

export default Page;
```

**Example: Root `Form` Component (`packages/form-engine/src/components/layout/Form.tsx`)**
*   This component will be the entry point for the form engine's rendering logic. It will manage overall form state (like `formData`, `currentStepIndex` for multipage forms if not handled by `SchemaForm` in `schema-viewer`), handle submission logic, and provide the initial `FormEngineContext`.
*   Its `transformProps` will set up the `FormEngineContext` for its children.
*   The `SchemaForm.tsx` in `packages/schema-viewer` will pass its `schema` (which should be a `Form` component config) and `context` to the `DynamicRenderer`.

---

## IV. Schema Parsing (`packages/form-engine/src/services/schemaParser.ts`)

This service is simplified to parse the root form schema, relying on individual component schemas for deeper validation.

```typescript
// packages/form-engine/src/services/schemaParser.ts
import { z } from "zod";
import { getComponentDefinition } from "../core/componentRegistryService"; // Ensure this path is correct

// This is the schema for the raw input to parseRootFormSchema
// It expects at least a 'type' field to determine the root component.
const AnyRootComponentConfigSchema = z.object({
    type: z.string(),
}).passthrough(); // Allows other properties, to be validated by the specific component's schema

/**
 * Parses and validates the root form schema configuration.
 * The rawSchema is expected to be the configuration for a root component (e.g., type: "form").
 */
export function parseRootFormSchema(rawSchema: unknown): { config: any; errors?: z.ZodError } {
    const rootParseResult = AnyRootComponentConfigSchema.safeParse(rawSchema);
    if (!rootParseResult.success) {
        console.error("Invalid root schema: 'type' attribute is missing or invalid.", rootParseResult.error.flatten());
        return { config: null, errors: rootParseResult.error };
    }

    const componentType = rootParseResult.data.type;
    const componentDef = getComponentDefinition(componentType);

    if (!componentDef) {
        const errorMsg = `No component definition found for root schema type: "${componentType}"`;
        console.error(errorMsg);
        return { config: null, errors: new z.ZodError([{ code: z.ZodIssueCode.custom, path: ["type"], message: errorMsg }]) };
    }

    try {
        // Now validate against the specific component's schema
        const validatedConfig = componentDef.validateConfig(rawSchema);
        return { config: validatedConfig };
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error(`Validation errors for root component "${componentType}":`, error.flatten());
            return { config: null, errors: error };
        }
        const errorMsg = `Unexpected error parsing root component "${componentType}": ${error instanceof Error ? error.message : "Unknown error"}`;
        console.error(errorMsg);
        return { config: null, errors: new z.ZodError([{ code: z.ZodIssueCode.custom, path: [], message: errorMsg }]) };
    }
}
```
*Note: The existing `parseFormSchema` in `schemaParser.ts` (MEMORY[29ba72a0-3063-4c2e-9f32-9aaae6025a74]) which parses a pre-parsed JS object and has specific logic for `FormSchema` with `children` might need to be adapted or replaced by this `parseRootFormSchema` if the root is always a generic component like "form". If `parseFormSchema` is still used for a specific top-level structure before hitting `DynamicRenderer`, its Zod schema would be the one for the "form" component.*

---

## V. Updating `SchemaForm.tsx` (in `packages/schema-viewer`)

*   This component in the `schema-viewer` app will:
    1.  Import the YAML schema.
    2.  Call `parseRootFormSchema` (or an equivalent that validates the top-level "form" component structure).
    3.  Manage application-level state (like `formData`, `formContext` if not fully managed by the "form" component itself).
    4.  Render the `DynamicRenderer` from `@sfds/form-engine`, passing the parsed root config and the `FormEngineContext`.

```typescript
// packages/schema-viewer/src/app/page.tsx (Conceptual, where SchemaForm is used)
// This is the component in the schema-viewer app, NOT the "form" component in form-engine.
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { DynamicRenderer, FormEngineContext } from "@sfds/form-engine"; // Adjust import
import { parseRootFormSchema } from "@sfds/form-engine/services/schemaParser"; // Adjust
// import rawSchemaData from "@/schemas/your-form.yaml"; // Example import

interface AppSchemaFormProps {
    rawSchema: object; // Imported YAML as JS object
    initialContext?: Record<string, any>;
    onSubmit?: (formData: Record<string, any>) => void;
}

// This would be the component used in schema-viewer's app/page.tsx for example
export const SchemaFormConsumer: React.FC<AppSchemaFormProps> = ({ rawSchema, initialContext = {}, onSubmit }) => {
    const [parsedRootConfig, setParsedRootConfig] = useState<any | null>(null);
    const [schemaErrors, setSchemaErrors] = useState<any | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    // Potentially other app-level states like current page for a top-level multipage managed by schema-viewer

    useEffect(() => {
        const result = parseRootFormSchema(rawSchema); // Parse the root (e.g., "form" component config)
        if (result && result.config) {
            setParsedRootConfig(result.config);
            setSchemaErrors(null);
            // Initialize formData based on defaultValues in schema if any (logic to be added,
            // potentially by the "form" component itself via its context setup)
        } else {
            setParsedRootConfig(null);
            setSchemaErrors(result?.errors?.flatten());
        }
    }, [rawSchema]);

    const handleDataChange = useCallback((fieldName: string, value: any) => {
        setFormData(prevData => ({ ...prevData, [fieldName]: value }));
    }, []);

    // This context is passed to the DynamicRenderer, which then passes it to the root "form" component.
    // The "form" component might further refine or add to this context for its children.
    const formEngineContext: FormEngineContext = {
        formData,
        onDataChange: handleDataChange,
        formContext: initialContext,
        // Potentially other global things like form submission handlers, current page index if managed here
    };

    if (schemaErrors) {
        return <div>Error parsing schema: <pre>{JSON.stringify(schemaErrors, null, 2)}</pre></div>;
    }
    if (!parsedRootConfig) {
        return <div>Loading or invalid schema...</div>;
    }

    return (
        <DynamicRenderer
            config={parsedRootConfig} // This should be the config for the root "form" component
            context={formEngineContext}
            // ErrorComponent can be customized
        />
    );
};
```
*The existing `SchemaForm.tsx` in `packages/form-engine` would effectively become the "form" component definition (e.g., `packages/form-engine/src/components/layout/Form.tsx`) if this pattern is fully adopted. The example above (`SchemaFormConsumer`) illustrates how the `schema-viewer` might consume the engine.*

---

## VI. JSON Schema Generation (MEMORY[7659275e-2b51-460f-ba62-e0488a7c38f6])

*   The `generate-form-schema.ts` script needs to:
    1.  Import `componentRegistryService.ts` (or trigger auto-registration) to populate the registry.
    2.  Use `getAllComponentDefinitions()` to get all schemas.
    3.  Generate a root JSON schema that uses `oneOf` to allow any registered component type at the top level, or more specifically, a schema for the "form" component whose `children` property would then use `oneOf` for all other placeable components.
    4.  `zod-to-json-schema` will be used for converting individual Zod schemas.
    *   The `children` property in container components (like `Page` or `Form`) would have its `items` schema refer to a definition that is a `oneOf` array referencing all valid child component schemas (e.g., `#/definitions/AnyPlaceableComponent`).
    *   Example definition names in JSON schema: `TextConfig`, `SelectConfig`, `PageConfig`.

---

## VII. Automated Registration (Optional but Recommended)

*   **Using Webpack's `require.context`:**
    Create `packages/form-engine/src/core/autoRegister.ts`:
    ```typescript
    // packages/form-engine/src/core/autoRegister.ts
    function registerAllFormEngineComponents() {
        // Adjust path and regex to match single .tsx files, e.g., in components/*/*.tsx
        const requireComponent = require.context(
            "../components",
            true, // Recursive
            /\.tsx$/ // Matches all .tsx files in subdirectories
        );

        requireComponent.keys().forEach(filePath => {
            // Ensure we are not re-importing files from 'core' or other non-component dirs
            // if they happen to be under 'components' and match the regex.
            // A more specific path for require.context might be better, e.g., '../components/(fields|layout|etc)'
            // This example assumes component files are directly under fields, layout, etc.
            if (filePath.startsWith("./fields/") || filePath.startsWith("./layout/")) { // Example refinement
                 requireComponent(filePath);
            }
        });
    }
    // Check if require.context exists (Webpack environment)
    // @ts-ignore: require.context is a Webpack specific API.
    if (typeof require !== "undefined" && require.context) {
        registerAllFormEngineComponents();
    }
    ```
    Then, in `packages/form-engine/src/core/componentRegistryService.ts`:
    ```typescript
    import "./autoRegister"; // This line triggers all registrations
    export { getComponentDefinition, getAllComponentDefinitions } from "./componentFactory";
    ```

---

This updated structure co-locates component logic, schema, and presentation, simplifying development and maintenance. The `SchemaForm` in the `schema-viewer` package remains a consumer, passing the raw schema and initial context to the `form-engine`'s `DynamicRenderer`.
