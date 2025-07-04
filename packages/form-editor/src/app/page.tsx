"use client";

import { useState, useEffect, useRef } from "react";
import yaml from "js-yaml";
import Editor from "@monaco-editor/react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import {
	FormEngine,
	parseRootFormSchema,
	type FormConfig,
	type FormEngineHandle,
	type FormMeta,
} from "form-engine";
import EditorToolbar from "@/components/EditorToolbar";
import {
	getSavedForms,
	getFormContent,
	saveFormContent,
	deleteFormContent,
} from "@/lib/storage";
import { defaultForm, newForm } from "./default-yaml";

export default function FormEditorPage() {
	const [forms, setForms] = useState<string[]>([]);
	const [selectedForm, setSelectedForm] = useState<string>("");
	const [yamlInput, setYamlInput] = useState("");
	const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(0);
	const [formMeta, setFormMeta] = useState<FormMeta | null>(null);

	const formRef = useRef<FormEngineHandle>(null);

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

	// Parse YAML and update form config
	useEffect(() => {
		if (!yamlInput) {
			setFormConfig(null);
			setError("");

			return;
		}

		try {
			const parsedYaml = yaml.load(yamlInput);
			const { config, errors } = parseRootFormSchema(parsedYaml);

			if (config) {
				setFormConfig(config);
				setError(null);
			} else if (errors) {
				setError(JSON.stringify(errors.flatten(), null, 2));
			} else {
				setError("An unknown parsing error occurred.");
			}
		} catch (e: any) {
			// if an exception is thrown during YAML parsing, we'll show the error
			// below, but also keep whatever formConfig we have so far, so the user
			// doesn't completely lose the context
			setError(e.message);
		}
	}, [yamlInput]);

	// Reset page when selected form changes
	useEffect(() => {
		setCurrentPage(0);
		setFormMeta(null);
	}, [selectedForm]);

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

	const handleDeleteForm = () => {
		if (!selectedForm) return;

		if (
			window.confirm(
				`Are you sure you want to delete the form "${selectedForm}"? This cannot be undone.`,
			)
		) {
			deleteFormContent(selectedForm);

			const remainingForms = forms.filter((f) => f !== selectedForm);
			setForms(remainingForms);

			if (remainingForms.length > 0) {
				const newSelectedForm = remainingForms[0];
				setSelectedForm(newSelectedForm);
				setYamlInput(getFormContent(newSelectedForm) || "");
			} else {
				// No forms left, create a new default one
				const name = "sample-form";
				saveFormContent(name, defaultForm);
				setForms([name]);
				setSelectedForm(name);
				setYamlInput(defaultForm);
			}
		}
	};

	const handlePrevPage = () => formRef.current?.goToPage(currentPage - 1);
	const handleNextPage = () => formRef.current?.goToPage(currentPage + 1);

	const formOutput = formConfig ? (
		<FormEngine
			ref={formRef}
			schema={formConfig}
			formContext={{ formMode: "preview" }}
			currentPage={currentPage}
			onPageChange={setCurrentPage}
			onMetaChange={setFormMeta}
		/>
	) : null;

	const totalPages = formMeta?.pageCount ?? 0;
	const pageTitle =
		formMeta?.pageTitles[currentPage] ?? formMeta?.formTitle ?? "Form";

	return (
		<div className="flex flex-col h-screen w-screen">
			<EditorToolbar
				forms={forms}
				selectedForm={selectedForm}
				onNewForm={handleNewForm}
				onSelectForm={handleSelectForm}
				onDeleteForm={handleDeleteForm}
				currentPage={currentPage}
				totalPages={totalPages}
				pageTitle={pageTitle}
				onPrevPage={handlePrevPage}
				onNextPage={handleNextPage}
			/>
			<PanelGroup direction="horizontal" className="flex-grow">
				<Panel defaultSize={50}>
					<div className="h-full">
						<Editor
							height="100%"
							language="yaml"
							value={yamlInput}
							onChange={(value) => setYamlInput(value || "")}
							options={{
								minimap: { enabled: false },
								scrollBeyondLastLine: false,
								automaticLayout: true,
							}}
						/>
					</div>
				</Panel>
				<PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />
				<Panel defaultSize={50}>
					<div className="p-6 h-full overflow-auto">
						{error && <pre className="error-message">{error}</pre>}
						{error && formOutput ? (
							<div className="opacity-50">{formOutput}</div>
						) : (
							formOutput
						)}
					</div>
				</Panel>
			</PanelGroup>
		</div>
	);
}
