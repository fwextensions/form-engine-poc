# Form Engine Architecture Review and Recommendations

Date: 2025-10-14

This document reviews the current implementation of the `form-engine` package and proposes targeted improvements to structure, API ergonomics, component authoring, styling/theming, dynamic behavior, performance, and tooling.

Key files referenced include:
- `packages/form-engine/src/engine/FormEngine.tsx`
- `packages/form-engine/src/engine/FormEngineContext.tsx`
- `packages/form-engine/src/engine/DynamicRenderer.tsx`
- `packages/form-engine/src/core/componentFactory.ts`
- `packages/form-engine/src/core/baseSchemas.ts`
- `packages/form-engine/src/core/conditionLogic.ts`
- `packages/form-engine/src/core/schemaParser.ts`
- `packages/form-engine/src/hooks/useFormRules.ts`
- `packages/form-engine/src/components/layout/{Form,Page,Html}.tsx`
- `packages/form-engine/src/components/fields/*.tsx`

# Findings

- **Architecture**
  - `FormEngine` exposes a hybrid controlled/uncontrolled page model, an imperative API (`goToPage()`, `getMeta()`), and emits `onMetaChange` with `FormMeta`.
  - Rendering is registry-driven via `createComponent()` and resolved dynamically by `DynamicRenderer`.
  - Central config preprocessing (`transformConfig`) and co-located Zod schemas are in place and consistent.

- **Rules and conditionals**
  - `useFormRules` flattens schema and returns `dynamicProps` per-component. These are merged in `DynamicRenderer`.
  - Per-component `condition` uses JSON Logic; rules use a separate `when`/`then` structure with simple equality checks.

- **Schema and preprocessing**
  - `commonFieldTransform` centralizes label asterisk → `required` logic; field schemas extend `baseFieldConfigSchema`.
  - Layout schemas (`form`, `page`) extend `baseLayoutComponentConfigSchema`.

- **Components**
  - Fields follow a pattern of `containerProps` + `controlProps` (e.g., `Text.tsx`), composed with `FormFieldContainer` and Radix Form.
  - `Form.tsx` manages multi-page submit/next/prev and focuses first visible field after navigation.

- **API surface**
  - Public exports (`src/index.ts`) are clean: `FormEngine`, types, parser, and registry utils. `form-editor` consumes the controlled model correctly.

# Recommendations

## Structure and API

- **Use context directly in `DynamicRenderer`**
  - Replace the explicit `context` prop with `useFormEngine()`.
  - Pass `context.formContext` (not the entire context) to `evaluateCondition()`.

- **Expose derived hooks**
  - Add `useFormMeta()` to read `formTitle`, `pageCount`, `pageTitles`, `currentPageIndex` from context.
  - Add `useFormStructure()` to consume page info without re-parsing the schema in host apps.

- **Standardize props shape**
  - Normalize on `containerProps` and `controlProps` across all field components.

- **Page transition API**
  - Extend `PageConfigSchema` with optional `events`: `{ onEnter?, onExit?, beforeNext?, beforePrev? }`.
  - Wire `beforeNext`/`beforePrev` as async hooks (allow returning a Promise) in `Form.tsx`.

## Component creation and maintenance

- **Introduce a `createField()` helper**
  - Wrap `createComponent()` with a field-focused helper that:
    - Applies `commonFieldTransform` by default.
    - Maps `BaseFieldConfig` to `containerProps` automatically.
    - Accepts a typed builder for `controlProps`.
  - Refactor 2–3 existing fields to validate the pattern.

- **Keep auto-registration**
  - Current explicit `components/index.ts` imports are fine; optionally add Vite/webpack glob later if desired.

## Styling and theming

- **Centralize tokens and variants**
  - Move repeated class strings to a theme module or use `cva` (class-variance-authority) for slots/variants.
  - Provide a theme override provider in context to swap classes at runtime without editing each component.

- **Earlier validation feedback**
  - Add per-field `touched` or “validate on blur” to show `@radix-ui/react-form` messages before submit for better a11y.

## Rules and dynamic behavior

- **Unify rules evaluation using JSON Logic**
  - Allow `when` to be JSON Logic (in addition to current equality form) and evaluate via `evaluateCondition()`.
  - Extend `then` actions: `navigate` (page id/index), `fetch` (load external data to `formData`/`formContext`), `validate`.

- **Rename `dynamicProps` to `dynamicConfig`**
  - Matches what the engine actually merges into the validated config.

- **Dynamic text templating**
  - Support `{{formData.firstName}}`/`{{context.foo}}` interpolation in `label`, `title`, `description`.

## Performance and rendering

- **Reduce unnecessary re-renders**
  - Wrap field/layout components with `React.memo`.
  - Memoize handlers in `transformProps` and reuse a stable `renderChildrenCallback`.
  - In multipage mode, evaluate rules only for the current page (or page subtree) when feasible.
  - Consider `use-context-selector` or `useSyncExternalStore` to subscribe per-field and avoid whole-form re-renders.

- **Non-string option values**
  - For Select/Radio, allow non-strings in schema; serialize to string for UI and deserialize on change.

## Schema and validation

- **Promote `required` to top-level**
  - Keep `validation` for advanced constraints; map legacy `validation.required` to top-level in `transformConfig` for back-compat.

- **Improve number placeholders**
  - Allow `placeholder: string | number` and stringify in `transformProps`.

- **Sections and repeaters**
  - Add `section` layout component for grouping; optionally support subpages.
  - Add `repeater` component with a `template` for dynamic arrays.

## Navigation and UX

- **Per-page button overrides**
  - Already supported at the form level; allow optional per-`page` overrides that fall back to form defaults.

- **Focus management**
  - Keep first-visible-field focus in `Form.tsx`; ensure hidden/disabled are skipped (current code accounts for visibility).

## Tooling and editor

- **Monaco YAML LSP**
  - Integrate `monaco-yaml` in `form-editor` pointing to `dist/form-schema.json` for validation and completions.

- **Safe dynamic logic**
  - Stick with JSON Logic; avoid inline scripts. If needed, support whitelisted external functions.

# Phased plan

- **Phase 1: Ergonomics and correctness**
  - Remove `context` prop from `DynamicRenderer`; use `useFormEngine()`; pass `formContext` to `evaluateCondition()`.
  - Add `meta` to context and provide `useFormMeta()`.
  - Promote `required` to top-level; keep mapping for back-compat.
  - Update Select/Radio for non-string values with serialize/deserialize.

- **Phase 2: DX and maintainability**
  - Introduce `createField()` helper and refactor Text/Number/Select.
  - Standardize `containerProps`/`controlProps` naming.
  - Extract Tailwind tokens with `cva` and add a theme override provider.

- **Phase 3: Dynamic behavior**
  - Unify rules DSL to support JSON Logic under `when`.
  - Add `events` on `page` and wire `beforeNext` async hook.
  - Add string interpolation for dynamic text.

- **Phase 4: Performance**
  - `React.memo`, memoized children, page-scoped rules evaluation.
  - Evaluate per-field subscription store if needed.

- **Phase 5: Editor + docs**
  - `monaco-yaml` integration in `form-editor`.
  - Update README/docs for `useFormMeta`, `useFormStructure`, unified rules DSL, and page events.

# Example snippets

## `useFormMeta()`

```ts
// packages/form-engine/src/engine/useFormMeta.ts
import { useFormEngine } from "./FormEngineContext";

export function useFormMeta() {
	const { formMode, currentPageIndex, totalPages, formContext, /* new */ meta } = useFormEngine();
	return {
		...meta,
		currentPageIndex: currentPageIndex ?? 0,
		totalPages: totalPages ?? 1,
		formMode,
		formContext,
	};
}
```

## `DynamicRenderer` uses context directly

```tsx
// packages/form-engine/src/engine/DynamicRenderer.tsx
import { useFormEngine } from "./FormEngineContext";

export const DynamicRenderer: React.FC<DynamicRendererProps> = ({ config, ErrorComponent = DefaultErrorComponent }) => {
	const context = useFormEngine();
	// ...
	if (validatedConfig.hidden || (validatedConfig.condition && !evaluateCondition(
		validatedConfig.condition,
		context.formData,
		context.formContext,
	))) {
		return null;
	}
	// ...
};
```

## Select/Radio support for non-string values

```ts
// inside Select.transformProps
const serialize = (v: unknown) => JSON.stringify(v);
const deserialize = (s: string) => JSON.parse(s);

const options = config.options.map(o => ({ ...o, value: serialize(o.value) }));
const value = context.formData[id] !== undefined ? serialize(context.formData[id]) : undefined;

return {
	// ...
	options,
	onValueChange: (v: string) => context.onDataChange(id, deserialize(v)),
};
```

# Rules: whenLogic (JSONLogic)

In addition to simple equality rules using `when`, you can express complex conditions with JSONLogic via `whenLogic`.

- **Data available to JSONLogic**
  - `formData`: current form values
  - `context`: `formContext` passed into `FormEngine`

Example: reveal a component only when `country === 2` (Canada):

```yaml
- id: canadaInfo
  type: html
  tag: div
  className: p-2 bg-indigo-50 rounded
  content: "This message shows only when country is Canada (via whenLogic)."
  hidden: true
  rules:
    - whenLogic:
        "==":
          - { var: "formData.country" }
          - 2
      then:
        - set:
            hidden: false
```

Back-compat: the simpler `when` equality checks still work:

```yaml
rules:
  - when:
      field: newsletterSubscription
      is: true
    then:
      - set:
          hidden: false
```

You can also use per-component `condition` (JSONLogic) to control visibility directly on a component without rules side effects:

```yaml
- id: comments
  type: textarea
  label: Comments
  condition:
    "==":
      - { var: "formData.country" }
      - 2
```

# Notes

- These recommendations align with the current design choices: hybrid navigation, imperative API, centralized preprocessing, registry-driven rendering, and the existing rules engine. The aim is to simplify authoring, improve a11y and styling flexibility, and reduce re-renders while enabling richer dynamic behavior.
