# Form Element Catalog: Architecture Review

Date: 2026-11-05

> **Status (2026-11-05):** Phase 0 and proposals 3.1–3.6 are implemented on this branch; see the commit history
> ("proposal 1" … "proposal 6") and `CLAUDE.md` for the resulting architecture. Phase 2 (explicit catalog
> instances) is not started. The dependency update surfaced one pin worth knowing about: `monaco-editor` 0.52 (for `monaco-yaml`).
> The chat stack was moved to `ai` 7 / assistant-ui 0.15 in a follow-up change.

Scope: the whole monorepo, with emphasis on how the component catalog (the set of form element types, their schemas, and everything derived from them) is defined, registered, built and consumed. This follows on from `form-engine-architecture-review.md` (2025-10-14); it does not repeat that document's rendering and styling recommendations except where they intersect with the catalog.

Everything in the "Verified findings" section was reproduced in a fresh checkout (`npm ci`, then the commands quoted).

---

## 1. The shape of the system today

The catalog is the hub of the repo. Six consumers read from it:

```
                 createComponent()  (one call per component file, at import time)
                          │
                          ▼
          ┌──────── componentRegistry / catalogRegistry ────────┐
          │                                                     │
   DynamicRenderer     parseRootFormSchema     getRegisteredCatalog()
   (render + merge        (root validation)          │
    dynamic props)                         ┌─────────┼──────────────┐
                                           ▼         ▼              ▼
                                  generateCatalogPrompt   toJsonSchema   scripts/generate-form-schema
                                  (LLM system prompt,     (unused)       (dist/form-schema.json, for
                                   editor chat)                           VS Code / monaco)
```

And two consumers that *should* read from it but hold their own hand-typed copy:

- `packages/form-exporters/src/fillout/fillout-exporter.ts` — `SchemaNode` interface plus `componentMappers` keyed by type strings.
- `packages/form-editor/src/lib/jsonl/*` — `SchemaComponent` type and the patch applier, which never validate a patched component against the catalog.

The design intent (Zod schema + React component + transforms colocated in one file, auto-registration on import) is good and I would keep it. The problems are downstream: the derived artifacts are broken or drifting, and nothing in the build notices.

---

## 2. Verified findings, most severe first

### 2.1 Catalog introspection is silently broken (zod 4 vs zod-to-json-schema 3)

`form-engine` depends on `zod ^4.4.3` and `zod-to-json-schema ^3.25.2`. The latter only understands zod 3 internals (`_def.typeName`), so on zod 4 schemas it returns an empty object. Three things depend on it:

| Consumer | Observed output |
|---|---|
| `generateCatalogPrompt()` → LLM system prompt | Every component's **Properties** section reads `No properties defined.` (12 kB prompt, zero property information) |
| `scripts/generate-form-schema.ts` → `dist/form-schema.json` | A 141-byte file whose `FormSchema` definition is `{}` |
| `catalog/toJsonSchema.ts` | Same, but nothing calls it |

```
$ cd packages/form-engine && npx vitest run
 Test Files  3 failed (3)
      Tests  42 failed | 29 passed (71)
```

All 42 failures are `expected 'No properties defined.' to contain '**type**'` and the like. The tests are correct; the code regressed when deps were bumped (the lockfile has had zod 4 for the whole visible history, so the regression predates the shallow clone window).

Practical effect: the AI editing loop currently works only because the model guesses prop names from the hand-written examples in `description` strings and the prose sections of the prompt. `select` and `radiogroup` are the only components with any property documentation at all, and only because their `description` strings embed YAML examples.

zod 4 ships a native converter and it handles every registered schema:

```ts
import { z } from "zod";
z.toJSONSchema(schema, { io: "input", unrepresentable: "any" });
// text → properties: id,type,rules,hidden,condition,label,description,required,
//        disabled,validation,placeholder,defaultValue,inputType; required: [id,type]
// .describe() strings come through as "description"; z.any() → {} with unrepresentable:"any"
```

I ran it over all 15 registered types without error.

### 2.2 No gate catches any of this

- `form-engine` `lint` script is `echo 'Lint script ... not yet implemented'`.
- `npm run build --workspace=form-engine` fails: TypeScript 6 rejects `moduleResolution: "node"` and `baseUrl` in `packages/form-engine/tsconfig.json` (TS5107 / TS5101). So `build:all` fails too.
- `form-editor` tests cannot start: `@vitejs/plugin-react` is imported by `vitest.config.ts` but is not a devDependency.
- Root `npm run lint` lints only `form-editor`. There is no CI workflow.
- `validateSchema()` in `packages/form-editor/src/lib/schema-validator.ts` has a full test suite and is called by nothing.

CLAUDE.md's "verify functionality by running the applications" is therefore the only check, and the regression in 2.1 is invisible when you run the app: the form still renders, the chat still mostly works.

### 2.3 The catalog is re-declared by hand in three other places, and they have drifted

**Exporter.** `fillout-exporter.ts` keeps its own `SchemaNode` type and a `componentMappers` map. Two confirmed drifts:

- `addressValidation` is registered in the engine but has no mapper. It is dropped from the export with **no diagnostic** (`processComponent` returns `null`; `diagnostics: []`).
- Commit `2d77db4` added string-shorthand options (`options: [California, Nevada]`) to `select`/`radiogroup`. The exporter still does `o.label` / `o.value` on each option, so a shorthand option exports with no label and no value text at all. Confirmed by exporting `{ type: "select", options: ["A","B"] }` and inspecting `staticOptions`.

Both would have been caught by a one-line test: "every registered field type has a mapper."

**Prompt generator.** `catalog/prompt.ts` hard-codes a type list in `generateComponentExample` (`text, email, password, tel, number, textarea, select, checkbox, radio`). `radio` is not a registered type. `test-schemas/dahlia-application.yaml` also uses `type: radio` twice, which renders the red error box. The schema-structure, rules and validation sections are hand-written prose that must be kept in sync with `baseSchemas.ts` by eye.

**Rules engine and JSONL types.** `useFormRules.ts` re-declares the rule shape as a TS interface instead of `z.infer<typeof ruleSchema>`. `jsonl/types.ts` `SchemaComponent` is `{ type; id?; children?; [k]: unknown }`. `DynamicRenderer` reads `hidden`, `condition`, `children`, `id` through `any`. None of these break today, but each is a place where a schema change has to be mirrored manually.

### 2.4 Component files are mostly boilerplate, and the boilerplate has bugs

`Text.tsx` registers five types (`text`, `email`, `password`, `tel`, `number`) with five copy-pasted `transformProps` bodies. Across the 11 registered field/layout components the same `label / description / required / disabled || view-mode / value / onChange` plumbing appears 11 times. Divergences that have crept in:

- `TextConfigSchema.inputType` (enum of HTML input types, default `"text"`) is accepted by the schema and documented to the model, but `transformProps` never reads it. The `<input type>` is set from `config.type`, so `inputType: number` on a `text` field does nothing.
- `Checkbox` and `DatePicker` ignore `config.disabled`; the other fields honour it.
- `Form.tsx` hard-codes `id: "form-engine-root"` and `Html.tsx` hard-codes the same string as its CSS scope selector; two copies of one constant.

The previous review proposed a `createField()` helper for exactly this and it was not done. It is the single highest-leverage change for catalog maintenance.

### 2.5 Validation strips unknown keys, so authoring mistakes vanish

`baseComponentConfigSchema` is a plain `z.object`, which strips unknown keys. I confirmed:

```ts
getComponentDefinition("text").validateConfig({ type: "text", id: "a", labell: "typo", foo: 1 })
// → { id: "a", type: "text", inputType: "text" }   — no error, no warning
```

Neither the YAML editor nor the AI loop surfaces a typo. Meanwhile `validation` is `.passthrough()`, so `minLength`, `pattern`, `email` etc. are accepted, documented to the model in `getValidationRulesDocumentation()`, and then never enforced: only `required` reaches the DOM. The model is being told about features that do not exist.

### 2.6 Registry design: workable, but it limits where you can go next

- Two parallel maps (`componentRegistry`, `catalogRegistry`) hold the same data; `CatalogEntry` is a strict subset of `ComponentDefinition`. `createCatalog`, `getCatalogEntry`, `getCatalogTypes` form a second API over the same thing and only `getCatalogTypes` is used (once).
- Registration is a module-level side effect ordered by `components/index.ts`. That means exactly one catalog per process, no tree-shaking, and `import "../src/components"` sprinkled into scripts and tests to "make sure they're registered."
- `children: z.array(z.any())` on layout schemas means the registry cannot say which types may nest where. `generate-form-schema.ts` reconstructs that recursion by hand with its own `formSchema` (which makes `title` required, unlike `FormConfigSchema` where it is optional).
- `type: "form"` is special-cased in `FormEngine.tsx`, `Form.tsx`, `useFormRules.ts`, the exporter, and the generate script. `page` similarly. The `hasChildren` flag is the only hint the registry gives.
- Two documentation channels: `description` on `createComponent` (used by all) and `.describe()` on Zod fields (used only by `Select` and `RadioGroup`). Only the first currently reaches the model, because of 2.1.

---

## 3. Proposals

### Phase 0 — unbreak and gate (hours)

1. **Replace `zod-to-json-schema` with `z.toJSONSchema`** in `catalog/toJsonSchema.ts`, `catalog/prompt.ts`, and `scripts/generate-form-schema.ts`; drop the dependency. Suggested options: `{ io: "input", unrepresentable: "any", reused: "ref" }`. The `formatPropsFromZodSchema` logic can stay; only the first line changes. The 42 failing tests should go green.
2. **Fix the build.** `packages/form-engine/tsconfig.json`: `moduleResolution: "bundler"`, remove `baseUrl` (keep `paths` with a `./src/*` target). Add `@vitejs/plugin-react` to form-editor devDependencies. Replace the `lint` stub with `eslint src` (share the editor's flat config via a root `eslint.config.mjs`).
3. **Add a CI workflow** that runs `npm ci`, `lint:all`, `test --workspaces --if-present`, `build:all`. Add a root `test` script.
4. **Add three catalog invariant tests** in `form-engine`:
   - every registered type's JSON schema has at least `id`/`type` in `properties`;
   - every type mentioned anywhere in `prompt.ts` is registered (kills `radio`);
   - every committed `test-schemas/*.yaml` parses through `parseRootFormSchema` with no errors.

   And one in `form-exporters`: `Object.keys(componentMappers)` ⊇ every registered type with `kind === "field"` (after 3.1 below), or at minimum an assertion that unmapped types produce a diagnostic.

### Phase 1 — make the registry the single source of truth

#### 3.1 One registry, richer entries

Collapse the two maps into one and widen `ComponentDefinition` so every consumer can be *derived* from it:

```ts
export interface ComponentDefinition<C extends BaseConfig = BaseConfig, P = unknown> {
	type: string;
	kind: "field" | "layout" | "static";
	schema: z.ZodObject<any>;                 // input shape, strict (see 3.4)
	component: React.ComponentType<P>;
	transformConfig?: (raw: Record<string, unknown>) => Record<string, unknown>;
	transformProps?: (config: C, ctx: FormEngineContext, renderChildren: RenderChildren) => P;
	meta: {
		description: string;
		/** A minimal valid config. Parsed through `schema` in a test, so it cannot rot. */
		example: Omit<C, "type">;
		/** Extra prose for the LLM prompt / docs. Optional. */
		notes?: string;
	};
	/** Which types may appear in `children`. Omit for leaf components. */
	children?: { allow: "any" | readonly string[] };
	/** Value semantics, so exporters and data layers do not have to guess. */
	value?: {
		empty: unknown;
		serialize?: (v: unknown) => string;
		deserialize?: (s: string) => unknown;
	};
}
```

What this buys:

- `kind` replaces `hasChildren` plus the scattered `type === "form" / "page"` checks (`FormEngine` can select pages by `kind === "layout" && type === "page"` today, and `kind === "field"` tells the exporter and the duplicate-id checker what to look at).
- `meta.example` replaces `generateComponentExample`'s hard-coded list, and a test parses every example through its own schema.
- `children.allow` lets the JSON Schema and the JSONL patch applier reject `{"op":"add","parentId":"someTextField",...}` instead of producing a tree the renderer can't draw.
- `value` gives the exporter and any future data layer a declared empty value and serialization, instead of `serializeForUI` being a private convention of two components.

Drop `createCatalog` / `getCatalogEntry` / `getCatalogTypes` or make them thin wrappers over the one map. `getRegisteredCatalog()` becomes `getCatalog()`.

#### 3.2 `defineField()` on top of `createComponent()`

This is the previous review's `createField`, made concrete:

```ts
type FieldControl<C, V> = (args: {
	config: C;
	value: V;
	setValue: (v: V) => void;
	disabled: boolean;
	inputProps: { id: string; name: string; required?: boolean; "aria-describedby"?: string };
}) => React.ReactNode;

export function defineField<S extends z.ZodRawShape, V>(def: {
	type: string;
	schema: S;                                   // fields beyond baseFieldConfigSchema
	description: string;
	example: Record<string, unknown>;
	value: { empty: V; serialize?; deserialize? };
	control: FieldControl<BaseFieldConfig & z.infer<z.ZodObject<S>>, V>;
}) {
	const schema = baseFieldConfigSchema.extend({ type: z.literal(def.type), ...def.schema }).strict();
	return createComponent({
		type: def.type,
		kind: "field",
		schema,
		component: FieldFrame,                   // FormFieldContainer + control
		transformConfig: commonFieldTransform,
		transformProps: (config, ctx) => ({
			containerProps: { name: config.id, label: config.label, description: config.description, htmlFor: config.id },
			control: def.control({
				config,
				value: (ctx.formData[config.id] ?? config.defaultValue ?? def.value.empty) as V,
				setValue: (v) => ctx.onDataChange(config.id, v),
				disabled: ctx.formMode === "view" || !!config.disabled,
				inputProps: { id: config.id, name: config.id, required: config.validation?.required },
			}),
		}),
		meta: { description: def.description, example: def.example },
		value: def.value,
	});
}
```

The whole `Text.tsx` family then collapses to one definition plus variants:

```ts
const inputField = (type: string, inputType: string, description: string) =>
	defineField({
		type,
		description,
		schema: { placeholder: z.string().optional(), defaultValue: z.string().optional() },
		example: { id: `${type}Example`, label: "Label" },
		value: { empty: "" },
		control: ({ value, setValue, disabled, inputProps, config }) => (
			<Control asChild>
				<input {...inputProps} type={inputType} placeholder={config.placeholder}
					value={value} disabled={disabled} onChange={(e) => setValue(e.target.value)} className={inputClass} />
			</Control>
		),
	});

inputField("text", "text", "A single-line text input field");
inputField("email", "email", "An email input field");
inputField("tel", "tel", "A telephone number input field");
inputField("password", "password", "A password input field");
```

This fixes the dead `inputType`, the `disabled` inconsistencies, and the view-mode plumbing in one place, and makes a new field a ~20-line file. Keep `createComponent` for layout/static components (`form`, `page`, `html`) and for anything that genuinely needs custom `transformProps` (`addressValidation`).

#### 3.3 Derive the exporter from the registry

Keep Fillout knowledge in `form-exporters` (the engine should not know about targets), but change three things:

1. Export from **validated** config. Call `getComponentDefinition(node.type).validateConfig(node)` per node so asterisk labels, top-level `required`, string-shorthand options and future `transformConfig` normalisations happen once, in the engine. `extractLabel`, `isRequired` and the `o.label` option mapping in the exporter then go away.
2. Walk the tree using the registry (`kind`, `children`), not `node.type === "page"`.
3. Emit a diagnostic for any `kind === "field"` type without a mapper, and add the coverage test from Phase 0.

If a second target appears, consider an `exporters?: Record<string, Mapper>` slot on the definition so each component file declares its own mappings; until then the coverage test is enough.

#### 3.4 Strict schemas, and only document validation the engine enforces

- Make `baseComponentConfigSchema` and its extensions `.strict()`. In `DynamicRenderer`, unknown-key issues can be downgraded to a `console.warn` plus an editor diagnostic so live editing still renders. In the JSONL applier, reject the patch and feed the Zod message back to the model as a `message` op; that is a much better loop than silently stripping.
- Decide what `validation` means. Either type it per field kind (`minLength`/`maxLength`/`pattern` for text-like, `min`/`max` for number/date) and have `defineField` wire those into the control and a `Form.Message`, or remove them from the prompt. Today the model is told they work.

#### 3.5 Typed children and one real JSON Schema

Once `children.allow` exists, build the recursive JSON Schema inside the engine (a `finalizeCatalog()` step that creates the lazy union once, rather than `generate-form-schema.ts` reconstructing it with a divergent root). Then:

- `generate-form-schema.ts` becomes `writeFileSync(path, JSON.stringify(catalogToJsonSchema()))`.
- The editor can load the same schema into Monaco via `monaco-yaml` for completion and red squiggles (the 2025 review's recommendation; nothing in the repo uses `monaco-yaml` yet).
- The JSONL patch applier validates `add`/`update`/`replace` against it.

#### 3.6 Generate more of the prompt, write less of it

Keep the preamble and the "paper to digital" guidance as prose; they are policy, not schema. But:

- Generate the components section from `meta.example` + the per-type JSON Schema. Consider sending the JSON Schema fragment itself rather than a markdown bullet per property; it is denser and unambiguous. Measure tokens before and after.
- Generate the rules section from `ruleSchema` (export it from `baseSchemas.ts` and register it like a component, or give it its own `meta`).
- Remove the type list from `generateComponentExample`.
- Snapshot-test the generated prompt so changes to it show up in review.

### Phase 2 — explicit catalog instances (when you need a second catalog)

Today there is exactly one catalog per process, assembled by import side effects. That is fine for a single SF.gov editor, but the moment you want a base catalog plus an agency-specific one, or want to test a component in isolation, it bites. The migration is mechanical once 3.1 is in place:

```ts
export function createCatalog(defs: ComponentDefinition[]): Catalog;   // real constructor
export const defaultCatalog = createCatalog([...fields, ...layout]);   // what components/index.ts becomes

<FormEngine schema={schema} catalog={defaultCatalog} />
parseRootFormSchema(raw, catalog)
generateCatalogPrompt(catalog)
exportToFillout(schema, { catalog })
```

`createComponent` stops mutating a global and just returns the definition; `defineField` likewise. Keep `defaultCatalog` as the implicit argument everywhere so nothing in the editor has to change on day one.

---

## 4. Outside the catalog but worth a ticket

- `FormEngine.handleDataChange` spreads the captured `formData`; two synchronous updates in one tick lose the first. Use the functional `setFormData` form.
- `DynamicRenderer` re-runs `validateConfig` for every node on every render and keys children by index. Memoise validated config per node (the schema object is stable between keystrokes in the editor) and key by `id ?? index`.
- `test-schemas/dahlia-application.yaml` uses `type: radio` twice; these render the error box today.
- `tdd-schema.json` and `tdd-schema-v3.json5` at the repo root are early-design artifacts in a different shape from the current schema. Move under `docs/` or delete.
- `postcss.config.mjs.bak` is committed.

---

## 5. Suggested order

| Step | Effort | Unblocks |
|---|---|---|
| Phase 0.1 native `z.toJSONSchema` | 1 hour | Working prompt, working JSON schema, green tests |
| Phase 0.2–0.4 build, CI, invariant tests | half a day | Everything below is safe to refactor |
| 3.1 + 3.2 on the Text family | 1–2 days | Proves the pattern; migrate the other fields one per PR |
| 3.3 exporter on validated config + coverage test | half a day | Fixes the two confirmed export bugs |
| 3.4 strict + validation decision | 1 day | Better AI loop, honest prompt |
| 3.5 + 3.6 JSON schema, monaco-yaml, generated prompt | 2–3 days | Editor autocompletion, prompt that cannot drift |
| Phase 2 explicit catalogs | when needed | Multiple catalogs, isolation tests |
