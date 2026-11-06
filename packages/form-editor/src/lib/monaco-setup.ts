/**
 * Monaco setup for the YAML editor.
 *
 * Uses the npm `monaco-editor` build (instead of the CDN loader default) so
 * that `monaco-yaml` can attach its language service, and registers the
 * form-engine JSON Schema with it. This gives the editor completions, hover
 * docs and red squiggles for unknown keys, bad values and invalid nesting,
 * all derived from the component registry.
 *
 * Import this module only on the client (it touches `self`/`window`).
 */
import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";
import { configureMonacoYaml, type MonacoYaml } from "monaco-yaml";
import { getRegisteredCatalog, catalogToFormJsonSchema } from "@fwextensions/form-engine";

export const FORM_SCHEMA_URI = "form-engine://schema/form-schema.json";

let monacoYaml: MonacoYaml | null = null;

/** Web workers for the languages the editor uses. */
function installWorkers() {
	const env = (globalThis as unknown as { MonacoEnvironment?: { getWorker?: unknown } });
	if (env.MonacoEnvironment?.getWorker) return;
	env.MonacoEnvironment = {
		getWorker(_moduleId: string, label: string) {
			if (label === "yaml") {
				return new Worker(new URL("monaco-yaml/yaml.worker.js", import.meta.url));
			}
			return new Worker(new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url));
		},
	};
}

/**
 * Idempotent: configures the loader and the YAML language service once and
 * returns the shared monaco instance.
 */
export function setupMonaco(): typeof monaco {
	if (!monacoYaml) {
		installWorkers();
		loader.config({ monaco });

		const schema = catalogToFormJsonSchema(getRegisteredCatalog(), { id: FORM_SCHEMA_URI });
		monacoYaml = configureMonacoYaml(monaco, {
			enableSchemaRequest: false,
			hover: true,
			completion: true,
			validate: true,
			schemas: [
				{
					uri: FORM_SCHEMA_URI,
					// Every YAML model in the editor is a form document.
					fileMatch: ["*"],
					schema,
				},
			],
		});
	}
	// Debug/tooling hook (e.g. browser tests reading markers).
	(globalThis as unknown as { __monaco?: typeof monaco }).__monaco = monaco;
	return monaco;
}

/** Current validation markers for a model, for tooling and tests. */
export function getYamlMarkers(uri: monaco.Uri) {
	return monaco.editor.getModelMarkers({ resource: uri });
}
