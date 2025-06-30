"use client";

import { useState, useEffect } from "react";
import yaml from "js-yaml";
import Editor from "@monaco-editor/react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { FormEngine, parseRootFormSchema } from "form-engine";
import EditorToolbar from "@/components/EditorToolbar";
import { getSavedForms, getFormContent, saveFormContent } from "@/lib/storage";
import { defaultForm, newForm } from "./default-yaml";

export default function FormEditorPage() {
	const [forms, setForms] = useState<string[]>([]);
	const [selectedForm, setSelectedForm] = useState<string>("");
	const [yamlInput, setYamlInput] = useState("");
	const [formOutput, setFormOutput] = useState<React.ReactNode>(null);
	const [error, setError] = useState<string | null>(null);

	// Load forms and select the first one on initial render
	useEffect(() => {
		let savedForms = getSavedForms();

		if (savedForms.length === 0) {
			// If no forms, save the default one
			const name = "sample-form";

			saveFormContent(name, defaultForm);
			savedForms = [name];
		}

		setForms(savedForms);

		const firstForm = savedForms[0];
		setSelectedForm(firstForm);

		const content = getFormContent(firstForm);
		setYamlInput(content || defaultForm);
	}, []);

	// Save content when yamlInput changes for the selected form
	useEffect(() => {
		if (selectedForm) {
			saveFormContent(selectedForm, yamlInput);
		}
	}, [yamlInput, selectedForm]);

	useEffect(() => {
		if (!yamlInput) {
			setFormOutput(null);
			setError("");

			return;
		}

		let output = formOutput;
		let error = "";

		try {
			const parsedYaml = yaml.load(yamlInput);
			const { config, errors } = parseRootFormSchema(parsedYaml);

			if (config) {
				output = <FormEngine schema={config} formContext={{ formMode: "preview" }} />;
			} else if (errors) {
				error = JSON.stringify(errors.flatten(), null, 2);
				output = null;
			} else {
				error = "An unknown parsing error occurred.";
				output = null;
			}
		} catch (e: any) {
			// if an exception is thrown during YAML parsing, we'll show the error
			// below, but also keep whatever formConfig we have so far, so the user
			// doesn't completely lose the context
			error = e.message;
		}

		setFormOutput(output);
		setError(error);
	}, [yamlInput]);

	const handleNewForm = () => {
		const name = prompt("Enter new form name:");

		if (name && !forms.includes(name)) {
			const newYaml = newForm(name);

			saveFormContent(name, newYaml);
			setForms([...forms, name]);
			setSelectedForm(name);
			setYamlInput(newYaml);
		} else if (name) {
			alert("A form with this name already exists.");
		}
	};

	const handleSelectForm = (name: string) => {
		const content = getFormContent(name);

		if (content !== null) {
			setSelectedForm(name);
			setYamlInput(content);
		}
	};

	return (
		<div className="flex flex-col h-screen w-screen">
			<EditorToolbar
				forms={forms}
				selectedForm={selectedForm}
				onNewForm={handleNewForm}
				onSelectForm={handleSelectForm}
			/>
			<PanelGroup direction="horizontal" className="flex-grow">
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
						{error && formOutput
							? <div className="opacity-50">{formOutput}</div>
							: formOutput}
					</div>
				</Panel>
			</PanelGroup>
		</div>
	);
}
