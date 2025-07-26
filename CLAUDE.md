# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Root-level commands (run from repository root):
- `npm install` - Install all workspace dependencies
- `npm run dev` - Start form-editor with live preview (Next.js dev server)
- `npm run build` - Build form-editor package
- `npm run lint` - Lint form-editor package
- `npm run dev:form-preview` - Start Vite-based preview application
- `npm run dev:schema-viewer` - Start schema-viewer demo application
- `npm run generate-schema` - Generate JSON schema from component definitions
- `npm run lint:all` - Lint all packages
- `npm run build:all` - Build all packages

### Package-specific commands:
- **form-engine**: `npm run build --workspace=form-engine` (generates TypeScript build + JSON schema)
- **form-editor**: `npm run dev --workspace=form-editor` (Next.js with Monaco editor)
- **form-preview**: `npm run dev --workspace=form-preview` (Vite standalone preview)
- **schema-viewer**: `npm run dev --workspace=schema-viewer` (Next.js demo app)

### Testing:
- No formal test suite exists yet - verify functionality by running the applications
- Use `npm run lint:all` to check code quality across packages

## Project Architecture

### Monorepo Structure
This is an npm workspace monorepo with 4 packages:

1. **form-engine** (`packages/form-engine/`) - Core rendering library
   - Main entry point: `src/index.ts`
   - Exports: `FormEngine` component, `createComponent` factory, schema parser
   - Built with React 19, Zod validation, Radix UI components

2. **form-editor** (`packages/form-editor/`) - Schema editor with live preview  
   - Next.js 15 application with Monaco editor
   - Real-time YAML editing with form preview

3. **form-preview** (`packages/form-preview/`) - Standalone form renderer
   - Vite application for testing schemas
   - Uses `schema.yaml` file in package root

4. **schema-viewer** (`packages/schema-viewer/`) - Demo application
   - Next.js application showcasing different form schemas

### Core Components & Architecture

#### Component Registration System (`packages/form-engine/src/core/componentFactory.ts`)
- Uses factory pattern: `createComponent()` registers components with:
  - Zod schema for validation
  - React component implementation  
  - Optional prop transformation functions
  - Optional config preprocessing
- Components auto-register when imported
- Registry accessible via `getComponentDefinition(type)` and `getAllComponentDefinitions()`

#### Form Engine (`packages/form-engine/src/engine/FormEngine.tsx`)
- Main entry component that renders forms from YAML schemas
- Handles multi-page navigation, form state management
- Supports controlled/uncontrolled mode for page navigation
- Provides imperative API via React.forwardRef for external control
- Props: `schema`, `onSubmit`, `onDataChange`, `onPageChange`, `displayMode`, etc.

#### Dynamic Rendering (`packages/form-engine/src/engine/DynamicRenderer.tsx`)
- Recursively renders components from schema config
- Merges static props with dynamic props from rules engine
- Handles component lookup and prop transformation

#### Rules Engine (`packages/form-engine/src/hooks/useFormRules.ts`)
- Implements conditional logic: `when`/`then` rules in YAML schema
- Updates component props dynamically based on form state
- Returns `DynamicPropsMap` of component ID to props
- Supports actions: `set` (modify props), `log` (debugging)

#### Field Components (`packages/form-engine/src/components/fields/`)
- Standard form fields: Text, Checkbox, RadioGroup, Select, DatePicker, Textarea, File
- Built with Radix UI primitives and Tailwind CSS
- Each component registers itself via `createComponent()`
- Support for validation, required fields (asterisk notation), conditional logic

#### Layout Components (`packages/form-engine/src/components/layout/`)
- Form: Root form container with submission handling
- Page: Multi-step form page container  
- FormFieldContainer: Individual field wrapper with labels/validation
- Html: Static HTML content blocks

### Schema Processing Flow
1. YAML schema → `parseRootFormSchema()` → `FormConfig` object
2. `FormEngine` processes config, extracts pages, manages state
3. `DynamicRenderer` recursively renders components
4. `useFormRules` evaluates conditional logic, merges dynamic props
5. Component factory looks up registered components and renders

### Form State Management
- Form data stored in `FormEngine` state as `Record<string, unknown>`
- Data flows up via `onDataChange` callback to parent components
- Rules engine subscribes to data changes for conditional logic
- Multi-page navigation managed internally or externally (controlled mode)

## Key Implementation Patterns

### Adding New Field Components
1. Create component file in `packages/form-engine/src/components/fields/`
2. Define Zod schema for component configuration
3. Implement React component with proper TypeScript interface
4. Register using `createComponent()` with schema and component
5. Export from `packages/form-engine/src/components/index.ts`
6. Component will auto-register when engine imports `./components`

### Schema Structure
- Root type: `form` with `children` array
- Page type: `page` with `children` array for multi-page forms  
- Field components: Various types (text, checkbox, etc.) with field-specific props
- Conditional logic: `rules` array with `when`/`then` structure
- Required fields: Use asterisk notation in `label` (e.g., "Name*")

### Build Process
- `form-engine` package builds TypeScript to `dist/` and generates JSON schema
- Other packages are Next.js or Vite applications  
- No current CI/CD - packages used within monorepo only
- JSON schema generation: `npm run generate-schema` creates schema from Zod definitions

## Development Workflows

### Schema Development
1. Edit YAML schemas in form-preview (`packages/form-preview/schema.yaml`)
2. Run `npm run dev:form-preview` to see live preview
3. Or use form-editor (`npm run dev`) for Monaco editor with live preview

### Component Development  
1. Add/modify components in `packages/form-engine/src/components/`
2. Test in form-preview or schema-viewer applications
3. Run `npm run generate-schema` to update JSON schema definitions
4. Use form-editor to test component in live YAML editing environment

### Multi-Package Development
- Changes to form-engine automatically picked up by dependent packages in monorepo
- Use workspace-specific commands to work on individual packages
- `npm run dev` typically starts the most useful development server (form-editor)