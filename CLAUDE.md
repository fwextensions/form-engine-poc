# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Root-level commands (run from repository root):
- `npm install` - Install all workspace dependencies (`.npmrc` sets `legacy-peer-deps`; see Dependency notes)
- `npm run dev` - Start form-editor with live preview (Next.js dev server)
- `npm run check` - Lint, typecheck, test and build every package. This is what CI runs; run it before pushing.
- `npm run lint:all` / `npm run typecheck` / `npm test` / `npm run build:all` - The individual gates
- `npm run generate-schema` - Write the registry-derived JSON Schema to `packages/form-engine/dist/form-schema.json`

### Package-specific commands:
- **form-engine**: `npm run test --workspace=form-engine` (vitest), `npm run build --workspace=form-engine` (JSON schema + tsc)
- **form-editor**: `npm run dev --workspace=form-editor` (Next.js with Monaco editor)
- **form-exporters**: `npm run test --workspace=form-exporters`

### Testing:
- Every package has a vitest suite; `npm test` runs them all. CI (`.github/workflows/ci.yml`) runs `npm run check`.
- `packages/form-engine/src/catalog/__tests__/catalog.invariants.test.ts` and `jsonSchema.test.ts` are the guard rails for the catalog: every registered type must have a kind, description and an example that parses through its own schema; committed `test-schemas/*.yaml` must validate; the prompt may only mention registered types.
- `packages/form-engine/src/catalog/__tests__/__snapshots__/catalog-prompt.md` is a snapshot of the LLM system prompt. If you change the prompt or a component's docs on purpose, update it with `npx vitest run -u` inside `packages/form-engine` and review the diff.
- For UI changes, the editor can be driven with the pre-installed Playwright (`require("playwright")`) against `npm run dev`.

## Project Architecture

### Monorepo Structure
This is an npm workspace monorepo with 3 packages:

1. **form-engine** (`packages/form-engine/`) - Core rendering library and component catalog
   - Main entry point: `src/index.ts`
   - Built with React 19, Zod 4, Radix UI components
   - Test schemas in `test-schemas/` directory

2. **form-editor** (`packages/form-editor/`) - Schema editor with live preview
   - Next.js 16 application with a Monaco YAML editor (schema-aware via `monaco-yaml`) and an AI assistant that edits the schema with JSONL patches

3. **form-exporters** (`packages/form-exporters/`) - Export adapters for external platforms
   - Currently supports: Fillout (v2 export JSON). Best-effort export with diagnostics for unmappable features.

### The component registry is the single source of truth

Every component type is registered once, in its own file, with `createComponent()` (`src/core/componentFactory.ts`) or, for fields, `defineField()` (`src/core/defineField.tsx`). The registry entry (`ComponentDefinition`) carries everything downstream consumers need, and all of them are derived from it rather than keyed by hand-typed strings:

| Consumer | Reads from the registry |
|---|---|
| `DynamicRenderer` | `component`, `transformProps`, lenient `checkConfig()` |
| `parseRootFormSchema()` / `validateSchemaTree()` | `checkConfig()`, `children.allow/deny`, `kind` |
| `generateCatalogPrompt()` (LLM system prompt) | `schema`, `meta.description/example/notes`, `children` |
| `catalogToFormJsonSchema()` (VS Code, Monaco, validators) | `schema`, `children.allow/deny` |
| Fillout exporter | `validateConfig()`/`checkConfig()`, `kind` |
| JSONL patch applier (editor) | `validateConfig()`, `children.allow/deny` |

`ComponentDefinition` fields:
- `type`, `kind` (`"field" | "layout" | "static"`), `schema` (Zod, strict), `component`
- `meta.description`, `meta.example` (minimal valid config minus `type`; verified by a test), `meta.notes`
- `children: { allow: "any" | string[], deny?: string[] }` on layout components only
- `value: { empty, serialize?, deserialize? }` on fields only
- `validateConfig(data)` throws on any issue, including unknown keys; `checkConfig(data)` strips unknown keys and returns them as warnings

### Adding a field component
1. Create `packages/form-engine/src/components/fields/MyField.tsx` and call `defineField({ type, description, example, schema, value, control })`. `schema` holds only the props beyond `baseFieldConfigSchema`; `control` receives `{ config, value, setValue, disabled, required, inputProps }` and renders the control. Label, description, required/disabled handling, `aria-describedby` and value fallback are handled for you. Use `labelPlacement: "control"` when the control renders its own label (see `Checkbox.tsx`).
2. If the field accepts validation keys beyond `required`, extend `textValidationSchema` or `numberValidationSchema` from `core/baseSchemas.ts` and wire each key to the native constraint attribute on the control. `FormFieldContainer` already renders a message for every constraint state.
3. Export the file from `packages/form-engine/src/components/index.ts`. It registers itself on import.
4. Add a Fillout mapper in `packages/form-exporters/src/fillout/fillout-exporter.ts` (the coverage test fails until you do).
5. Run `npm run check`; update the prompt snapshot.

Layout and static components (`form`, `page`, `html`) and fields with bespoke rendering (`addressValidation`) use `createComponent()` directly.

### Schema Processing Flow
1. YAML → `parseRootFormSchema()` → `{ config, issues, errors? }`. `issues` covers the whole tree (unknown types, invalid or unknown props, disallowed nesting, duplicate ids) with severities; the root config is returned whenever the root itself is usable so the editor can keep rendering.
2. `FormEngine` processes config, extracts pages, manages state
3. `DynamicRenderer` recursively renders components, using `checkConfig()` so a typo key warns once instead of hiding the field
4. `useFormRules` evaluates `rules` (`when`/`whenLogic` → `then: set|log`) and merges dynamic props
5. The component factory looks up the registered component and renders it

### Validation
- Schemas are strict. Unknown keys are errors for `validateConfig()` (tests, patches, exporters) and warnings for `checkConfig()` (renderer, editor).
- `validation.required` is accepted everywhere. Text-like fields also accept `minLength`/`maxLength`/`pattern`; `number` accepts `min`/`max`; `email` accepts `email`. Each is enforced through native constraint validation. The prompt documents exactly this set; keep them in sync.
- Required fields: `validation.required: true`, top-level `required: true`, or a trailing `*` in `label` (all normalised by `commonFieldTransform`).

### Form Editor (`packages/form-editor/`)
- `src/app/page.tsx` owns the YAML text, the parsed schema and the JSON patch history; schema errors and warnings are listed above the preview.
- `src/components/YamlEditor.tsx` + `src/lib/monaco-setup.ts` load the npm `monaco-editor` build and attach `monaco-yaml` with `catalogToFormJsonSchema()`, giving completions and squiggles from the registry.
- `src/lib/jsonl/` is the AI editing loop: `prompt.ts` (JSONL preamble), `patch-compiler.ts` (stream → ops), `patch-applier.ts` (ops → schema, validated against the registry; rejected ops are fed back to the model on its next turn), `history.ts` (undo/redo).

### Form Exporters (`packages/form-exporters/`)
- `exportToFillout(rawSchema)` validates every node through the registry first, so label asterisks, top-level `required` and option shorthand are normalised once, in the engine. Unknown or unmappable types produce diagnostics instead of being dropped.

## Dependency notes
- `.npmrc` sets `legacy-peer-deps=true` because `eslint-plugin-react` does not declare eslint 10 support.
- `@assistant-ui/react` and `@assistant-ui/react-ai-sdk` are pinned (with root `overrides` for their internal `core`/`store`/`tap`/`assistant-stream` packages): newer 0.14.x/1.3.x releases throw "Maximum update depth exceeded … getSnapshot" as soon as the editor mounts. Moving to the 0.15 line requires the `ai` 7 migration.
- `monaco-editor` is overridden to 0.52.2: `monaco-yaml`'s worker helper imports a path that 0.53+ no longer exports and uses the pre-0.53 worker bootstrap.
- The workspace package is named `form-engine`, which is also an unrelated public npm package. The `"form-engine": "*"` dependencies resolve to the workspace; keep it that way (or rename to a scoped name).
