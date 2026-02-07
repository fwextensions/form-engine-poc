"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import yaml from "js-yaml";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
	FormEngine,
	parseRootFormSchema,
	type FormConfig,
	type FormEngineHandle,
	type FormMeta,
} from "form-engine";
import EditorToolbar from "@/components/EditorToolbar";
import EditorPane from "@/components/EditorPane";
import SettingsDialog from "@/components/SettingsDialog";
import {
	getSavedForms,
	getFormContent,
	saveFormContent,
	deleteFormContent,
} from "@/lib/storage";
import { defaultForm } from "./default-yaml";
import {
	createHistoryManager,
	type SchemaComponent,
	type PatchOp,
	type HistoryState,
} from "@/lib/jsonl";

/**
 * Convert a SchemaComponent JSON tree to a YAML string.
 */
function schemaToYaml(schema: SchemaComponent): string {
	return yaml.dump(schema, {
		indent: 2,
		lineWidth: -1,
		noRefs: true,
		sortKeys: false,
	});
}

/**
 * Try to parse a YAML string into a SchemaComponent.
 * Returns null if parsing fails.
 */
function yamlToSchema(yamlStr: string): SchemaComponent | null {
	try {
		const parsed = yaml.load(yamlStr);
		if (parsed && typeof parsed === "object" && "type" in (parsed as object)) {
			return parsed as SchemaComponent;
		}
		return null;
	} catch {
		return null;
	}
}

/** Sentinel empty schema used as the initial history base. */
const EMPTY_SCHEMA: SchemaComponent = { type: "form", id: "emptyForm", children: [] };

export default function FormEditorPage() {
	const [forms, setForms] = useState<string[]>([]);
	const [selectedForm, setSelectedForm] = useState<string>("");
	const [yamlInput, setYamlInput] = useState("");
	const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(0);
	const [formMeta, setFormMeta] = useState<FormMeta | null>(null);
	const [activeTab, setActiveTab] = useState<"yaml" | "ai">("yaml");
	const [settingsOpen, setSettingsOpen] = useState(false);

	// JSONL state: the current schema as JSON and history
	const [schemaJson, setSchemaJson] = useState<SchemaComponent | null>(null);
	const [historyState, setHistoryState] = useState<HistoryState | null>(null);

	const formRef = useRef<FormEngineHandle>(null);
	const historyRef = useRef<ReturnType<typeof createHistoryManager> | null>(null);

	// Flag to prevent YAML→JSON→YAML feedback loops
	const suppressYamlSyncRef = useRef(false);

	/**
	 * Initialize or reset the history manager for a schema.
	 */
	const initHistory = useCallback((schema: SchemaComponent | null) => {
		const base = schema || EMPTY_SCHEMA;
		historyRef.current = createHistoryManager(base);
		setSchemaJson(schema);
		setHistoryState(historyRef.current.getState());
	}, []);

	// Load forms and select the first one on initial render
	useEffect(() => {
		let savedForms = getSavedForms();

		if (savedForms.length === 0) {
			const name = "sample-form";
			saveFormContent(name, defaultForm);
			savedForms = [name];
		}

		setForms(savedForms);

		const firstForm = savedForms[0];
		setSelectedForm(firstForm);

		const content = getFormContent(firstForm);
		const yamlContent = content || defaultForm;
		setYamlInput(yamlContent);

		// Initialize JSON state from saved YAML
		const parsed = yamlToSchema(yamlContent);
		initHistory(parsed);
	}, [initHistory]);

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
			setError(e.message);
		}
	}, [yamlInput]);

	// Sync YAML editor changes → JSON state (Option B: only when switching tabs)
	const handleTabChange = useCallback(
		(tab: "yaml" | "ai") => {
			if (activeTab === "yaml" && tab === "ai") {
				// Leaving YAML tab — sync any manual edits to JSON state
				const parsed = yamlToSchema(yamlInput);
				if (parsed && schemaJson) {
					// Only record if the schema actually changed
					const currentJson = JSON.stringify(schemaJson);
					const newJson = JSON.stringify(parsed);
					if (currentJson !== newJson && historyRef.current) {
						historyRef.current.recordManualEdit(schemaJson, parsed);
						setSchemaJson(parsed);
						setHistoryState(historyRef.current.getState());
					}
				} else if (parsed && !schemaJson) {
					// First time having a schema
					initHistory(parsed);
				}
			}
			setActiveTab(tab);
		},
		[activeTab, yamlInput, schemaJson, initHistory],
	);

	// Reset page when selected form changes
	useEffect(() => {
		setCurrentPage(0);
		setFormMeta(null);
	}, [selectedForm]);

	/**
	 * Handle AI-generated schema changes via JSONL patches.
	 */
	const handleJsonlSchemaChange = useCallback(
		(newSchema: SchemaComponent, patches: PatchOp[], userMessage: string) => {
			const snapshotBefore = schemaJson || EMPTY_SCHEMA;

			if (historyRef.current) {
				historyRef.current.push(patches, snapshotBefore, newSchema, userMessage);
				setHistoryState(historyRef.current.getState());
			}

			setSchemaJson(newSchema);

			// Update YAML from the new JSON
			suppressYamlSyncRef.current = true;
			setYamlInput(schemaToYaml(newSchema));
			// Reset suppression after a tick
			requestAnimationFrame(() => {
				suppressYamlSyncRef.current = false;
			});
		},
		[schemaJson],
	);

	/**
	 * Undo the last AI change.
	 */
	const handleUndo = useCallback(() => {
		if (!historyRef.current) return;

		const schema = historyRef.current.undo();
		if (schema) {
			setSchemaJson(schema);
			suppressYamlSyncRef.current = true;
			setYamlInput(schemaToYaml(schema));
			setHistoryState(historyRef.current.getState());
			requestAnimationFrame(() => {
				suppressYamlSyncRef.current = false;
			});
		}
	}, []);

	/**
	 * Redo the last undone AI change.
	 */
	const handleRedo = useCallback(() => {
		if (!historyRef.current) return;

		const schema = historyRef.current.redo();
		if (schema) {
			setSchemaJson(schema);
			suppressYamlSyncRef.current = true;
			setYamlInput(schemaToYaml(schema));
			setHistoryState(historyRef.current.getState());
			requestAnimationFrame(() => {
				suppressYamlSyncRef.current = false;
			});
		}
	}, []);

	const handleNewForm = () => {
		const name = prompt("Enter new form name:");

		if (name && !forms.includes(name)) {
			const emptySchema = "";

			saveFormContent(name, emptySchema);
			setForms([...forms, name]);
			setSelectedForm(name);
			setYamlInput(emptySchema);
			initHistory(null);
			setActiveTab("ai");
		} else if (name) {
			alert("A form with this name already exists.");
		}
	};

	const handleSelectForm = (name: string) => {
		const content = getFormContent(name);

		if (content !== null) {
			setSelectedForm(name);
			setYamlInput(content);
			initHistory(yamlToSchema(content));
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
				const content = getFormContent(newSelectedForm) || "";
				setYamlInput(content);
				initHistory(yamlToSchema(content));
			} else {
				const name = "sample-form";
				saveFormContent(name, defaultForm);
				setForms([name]);
				setSelectedForm(name);
				setYamlInput(defaultForm);
				initHistory(yamlToSchema(defaultForm));
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

	// Build history props for toolbar
	const historyProps = useMemo(() => {
		if (!historyState) return undefined;
		return {
			canUndo: historyState.canUndo,
			canRedo: historyState.canRedo,
			undoDescription: historyState.undoDescription,
			redoDescription: historyState.redoDescription,
			onUndo: handleUndo,
			onRedo: handleRedo,
		};
	}, [historyState, handleUndo, handleRedo]);

	// Build JSONL mode props for EditorPane
	const jsonlModeProps = useMemo(
		() => ({
			currentSchema: schemaJson,
			onSchemaChange: handleJsonlSchemaChange,
		}),
		[schemaJson, handleJsonlSchemaChange],
	);

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
				onOpenSettings={() => setSettingsOpen(true)}
				history={historyProps}
			/>
			<Group orientation="horizontal" className="flex-grow">
				<Panel defaultSize={50}>
					<EditorPane
						schema={yamlInput}
						onSchemaChange={setYamlInput}
						activeTab={activeTab}
						onTabChange={handleTabChange}
						onOpenSettings={() => setSettingsOpen(true)}
						jsonlMode={jsonlModeProps}
					/>
				</Panel>
				<Separator className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />
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
			</Group>
			<SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
		</div>
	);
}
