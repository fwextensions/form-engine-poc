# Project Structure

## Monorepo Organization

```
form-engine-monorepo/
├── packages/                    # Workspace packages
│   ├── form-engine/            # Core rendering library
│   ├── form-editor/            # Schema editor with live preview
│   ├── form-preview/           # Standalone Vite preview app
│   └── schema-viewer/          # Demo application
├── docs/                       # Specifications and documentation
├── .kiro/                      # Kiro configuration
└── tsconfig.base.json          # Shared TypeScript config
```

## form-engine (Core Library)

```
packages/form-engine/src/
├── components/
│   ├── fields/                 # Field components (Text, Select, Checkbox, etc.)
│   ├── layout/                 # Layout components (Form, Page, Html, etc.)
│   └── index.ts               # Component exports
├── core/
│   ├── componentFactory.ts    # Component registration system
│   ├── baseSchemas.ts         # Shared Zod schemas
│   ├── conditionLogic.ts      # Conditional rendering logic
│   └── schemaParser.ts        # YAML schema parsing
├── engine/
│   ├── FormEngine.tsx         # Main form orchestrator
│   ├── FormEngineContext.tsx  # React context for state
│   ├── DynamicRenderer.tsx    # Recursive component renderer
│   └── useFormMeta.ts         # Form metadata hook
├── hooks/
│   └── useFormRules.ts        # Rules engine hook
├── utils/                     # Utility functions
└── index.ts                   # Public API exports
```

## Component Registration Pattern

All components follow this structure:

1. **Define Zod Schema**: Type-safe configuration schema
2. **Define Props Interface**: React component props
3. **Implement Component**: React component with Radix UI
4. **Register with Factory**: Call `createComponent()` with schema, component, and transforms
5. **Export**: Add to `components/index.ts`

Example location: `packages/form-engine/src/components/fields/Checkbox.tsx`

## Application Packages

### form-editor (Next.js)
```
packages/form-editor/src/
├── app/
│   ├── page.tsx              # Main editor page
│   ├── layout.tsx            # App layout
│   └── default-yaml.ts       # Default schema
├── components/
│   └── EditorToolbar.tsx     # Editor controls
└── lib/
    └── storage.ts            # LocalStorage utilities
```

### form-preview (Vite)
```
packages/form-preview/src/
├── main.tsx                  # Entry point
├── components/
│   └── Toolbar.tsx           # Preview controls
└── schema.yaml               # Test schema
```

### schema-viewer (Next.js)
```
packages/schema-viewer/src/
├── app/
│   ├── page.tsx              # Main viewer
│   └── submission/
│       └── page.tsx          # Submission view
└── schemas/                  # Example schemas
```

## Documentation

- `docs/spec.md`: Implementation milestones and progress
- `docs/prd.md`: Product requirements
- `docs/*-spec.md`: Feature-specific specifications
- `README.md`: Quick start and overview

## Naming Conventions

- **Files**: PascalCase for components (`Checkbox.tsx`), camelCase for utilities (`storage.ts`)
- **Components**: PascalCase (`FormEngine`, `DynamicRenderer`)
- **Hooks**: camelCase with `use` prefix (`useFormRules`, `useFormMeta`)
- **Types**: PascalCase with descriptive suffixes (`CheckboxConfig`, `CheckboxProps`)
- **Schema IDs**: camelCase in YAML (`firstName`, `newsletterSubscription`)
- **Component Types**: lowercase in schema (`text`, `checkbox`, `page`)

## Key Files

- `packages/form-engine/src/core/componentFactory.ts`: Component registration system
- `packages/form-engine/src/engine/FormEngine.tsx`: Main orchestrator
- `packages/form-engine/src/hooks/useFormRules.ts`: Conditional logic engine
- `packages/form-engine/src/engine/DynamicRenderer.tsx`: Recursive renderer
- `packages/form-engine/scripts/generate-form-schema.ts`: JSON schema generator
