"use client";

import { useState, useEffect } from "react";
import yaml from "js-yaml";
import Editor from "@monaco-editor/react";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { FormEngine, parseRootFormSchema } from "form-engine";
import EditorToolbar from "@/components/EditorToolbar";
import { getSavedForms, getFormContent, saveFormContent, deleteFormContent } from "@/lib/storage";
import { defaultForm, newForm } from "./default-yaml";

export default function FormEditorPage() {
	const [forms, setForms] = useState<string[]>([]);
	const [selectedForm, setSelectedForm] = useState<string>("");
	const [yamlInput, setYamlInput] = useState("");
	const [formOutput, setFormOutput] = useState<React.ReactNode>(null);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(0);
	const [totalPages, setTotalPages] = useState(1);
	const [currentPageTitle, setCurrentPageTitle] = useState("");

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
		let newCurrentPage = currentPage;
		let newTotalPages = totalPages;
		let newCurrentPageTitle = currentPageTitle;

		try {
			const parsedYaml = yaml.load(yamlInput);
			const { config, errors } = parseRootFormSchema(parsedYaml);

			if (config) {
				const pages = Array.isArray(config.children)
					? config.children.filter((c: { type: string; }) => c?.type === "page")
					: [];

				newTotalPages = pages.length > 0 ? pages.length : 1;
				setTotalPages(newTotalPages);

				if (newCurrentPage >= newTotalPages) {
					newCurrentPage = newTotalPages - 1;
				}

				if (pages.length > 0 && pages[newCurrentPage]) {
					newCurrentPageTitle = pages[newCurrentPage].title || `Page ${newCurrentPage + 1}`;
				} else {
					newCurrentPageTitle = config.label || config.name || "Form";
				}

				output =
					<FormEngine
						schema={config}
						formContext={{ formMode: "preview" }}
						currentPage={newCurrentPage}
						onPageChange={setCurrentPage}
					/>;
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
		setCurrentPage(newCurrentPage);
		setTotalPages(newTotalPages);
		setCurrentPageTitle(newCurrentPageTitle);
	}, [yamlInput, currentPage]);

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
				`Are you sure you want to delete the form "${selectedForm}"? This cannot be undone.`
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

	const handlePrevPage = () => setCurrentPage((p) => Math.max(0, p - 1));

	const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1));

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
				pageTitle={currentPageTitle}
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
