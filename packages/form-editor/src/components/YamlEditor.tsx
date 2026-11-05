"use client";

import { useEffect, useState } from "react";
import Editor, { type OnMount, type OnChange } from "@monaco-editor/react";

export interface YamlEditorProps {
	defaultValue: string;
	onMount: OnMount;
	onChange: OnChange;
}

/**
 * The Monaco YAML editor with the form-engine schema attached.
 *
 * Monaco and monaco-yaml are loaded on the client only (they touch `window`
 * at import time), and the editor mounts once that setup has run so the
 * language service is attached to the same monaco instance the editor uses.
 */
export default function YamlEditor({ defaultValue, onMount, onChange }: YamlEditorProps) {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let active = true;
		import("@/lib/monaco-setup")
			.then((setup) => {
				setup.setupMonaco();
			})
			.catch((error) => {
				// Fall back to the default loader; the editor still works, without schema support.
				console.error("[YamlEditor] Monaco YAML setup failed:", error);
			})
			.finally(() => {
				if (active) setReady(true);
			});
		return () => {
			active = false;
		};
	}, []);

	if (!ready) {
		return <div className="h-full w-full" aria-busy="true" />;
	}

	return (
		<Editor
			height="100%"
			language="yaml"
			path="form.yaml"
			defaultValue={defaultValue}
			onMount={onMount}
			onChange={onChange}
			options={{
				minimap: { enabled: false },
				scrollBeyondLastLine: false,
				automaticLayout: true,
				wordWrap: "on",
			}}
		/>
	);
}
