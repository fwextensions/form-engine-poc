# Technology Stack

## Build System

- **Package Manager**: npm with workspaces for monorepo management
- **Language**: TypeScript 5 with strict mode enabled
- **Module System**: ESNext with bundler resolution

## Frontend Stack

- **Framework**: React 19
- **Application Framework**: Next.js 15 (App Router) for editor and schema-viewer
- **Build Tool**: Vite for form-preview package
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS 4

## Core Libraries

- **Schema Parsing**: js-yaml for YAML parsing
- **Validation**: Zod for runtime type validation and schema generation
- **Conditional Logic**: json-logic-js for rules evaluation
- **Code Editor**: Monaco Editor (in form-editor)

## TypeScript Configuration

- Base config extends from `tsconfig.base.json`
- Target: ESNext with DOM libraries
- Strict mode enabled with consistent casing enforcement
- Module resolution: bundler (Next.js/Vite)
- JSX: react-jsx for form-engine, preserve for apps

## Common Commands

### Development
```bash
npm install                    # Install all dependencies
npm run dev                    # Start form-editor (default)
npm run dev:form-preview       # Start Vite preview app
npm run dev:schema-viewer      # Start demo application
```

### Building
```bash
npm run build                  # Build form-editor
npm run build:all              # Build all packages
npm run generate-schema        # Generate JSON schema from Zod definitions
```

### Linting
```bash
npm run lint                   # Lint form-editor
npm run lint:all               # Lint all packages
```

### Package-Specific Commands
```bash
npm run <command> --workspace=<package-name>
# Example: npm run dev --workspace=form-preview
```

### Shell

IMPORTANT: Kiro is using git bash as the default shell, not Powershell.


## Architecture Patterns

- **Component Factory**: `createComponent()` for dynamic component registration
- **Zod Schemas**: Define component configuration and validation
- **React Context**: FormEngineContext for state management
- **Custom Hooks**: `useFormRules` for conditional logic evaluation
- **Recursive Rendering**: DynamicRenderer for nested component trees
