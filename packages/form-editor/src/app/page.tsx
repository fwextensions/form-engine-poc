"use client";

import React, { useState, useEffect } from "react";
import * as yaml from "js-yaml";
import Editor from "@monaco-editor/react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { FormEngine, parseRootFormSchema } from "form-engine";

const defaultYaml = `
type: form
id: simple-form
name: Simple Form
children:
  - type: page
    id: page1
    name: Page 1
    children:
      - type: text
        id: first_name
        label: First Name*
      - type: text
        id: last_name
        label: Last Name*
      - id: country
        type: select
        label: Country*
        options:
          - value: "us"
            label: "United States"
          - value: "ca"
            label: "Canada"
          - value: "gb"
            label: "United Kingdom"
`;

export default function FormEditorPage() {
	const [yamlInput, setYamlInput] = useState(defaultYaml.trim());
	const [formConfig, setFormConfig] = useState<any>(null);
	const [error, setError] = useState("");
	let formOutput = null;

	useEffect(() => {
		if (!yamlInput) {
			setFormConfig(null);
			setError("");
			return;
		}
		try {
			const parsedYaml = yaml.load(yamlInput);
			// Use the exported parser function which encapsulates Zod validation
			const { config, errors } = parseRootFormSchema(parsedYaml);

			if (config) {
				setFormConfig(config);
				setError("");
			} else if (errors) {
				setError(JSON.stringify(errors.flatten(), null, 2));
				setFormConfig(null);
			} else {
				setError("An unknown parsing error occurred.");
				setFormConfig(null);
			}
		} catch (e: any) {
			// if an exception is thrown during YAML parsing, we'll show the error
			// below, but also keep whatever formConfig we have so far, so the user
			// doesn't completely lose the context
			setError(e.message);
		}
	}, [yamlInput]);

	if (formConfig) {
		// set formMode to preview so that the form won't try to focus the first field
		// every time it's edited
		formOutput = <FormEngine schema={formConfig} formContext={{ formMode: "preview" }} />;

		if (error) {
			// FormEngine doesn't take a className prop yet, so wrap it to show an error state
			formOutput = <div className="opacity-50">{formOutput}</div>;
		}
	}

	return (
		<PanelGroup direction="horizontal" className="h-screen w-screen">
			<Panel defaultSize={50}>
				<div className="h-full">
					<Editor
						height="100%"
						language="yaml"
						value={yamlInput}
						onChange={(value) => setYamlInput(value || "")}
						options={{ minimap: { enabled: false }, automaticLayout: true }}
					/>
				</div>
			</Panel>
			<PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />
			<Panel defaultSize={50}>
				<div className="p-6 h-full overflow-auto">
					{error && <pre className="error-message">{error}</pre>}
					{formOutput}
				</div>
			</Panel>
		</PanelGroup>
	);
}
