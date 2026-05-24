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
import { exportToFillout, type ExportDiagnostic } from "form-exporters";
import EditorToolbar from "@/components/EditorToolbar";
import EditorPane from "@/components/EditorPane";
import FormSidebar from "@/components/FormSidebar";
import SettingsDialog from "@/components/SettingsDialog";
import ExportDiagnosticsDialog from "@/components/ExportDiagnosticsDialog";
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
import { loadChatMessages, deleteChatMessages, saveHistory, loadHistory, deleteHistory } from "@/lib/chat-storage";
import type { UIMessage } from "ai";

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
	const [currentPage, setCurrentPage] = useState(0);
	const [formMeta, setFormMeta] = useState<FormMeta | null>(null);
	const [activeTab, setActiveTab] = useState<"yaml" | "ai">("yaml");
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [exportDiagnostics, setExportDiagnostics] = useState<ExportDiagnostic[]>([]);
	const [exportFilename, setExportFilename] = useState("");
	const [exportDialogOpen, setExportDialogOpen] = useState(false);

	// Per-form chat messages (loaded from localStorage on form switch)
	const [chatMessages, setChatMessages] = useState<UIMessage[]>([]);

	// JSONL state: the current schema as JSON and history
	const [schemaJson, setSchemaJson] = useState<SchemaComponent | null>(null);
	const [historyState, setHistoryState] = useState<HistoryState | null>(null);

	const formRef = useRef<FormEngineHandle>(null);
	const historyRef = useRef<ReturnType<typeof createHistoryManager> | null>(null);

	// Flag to prevent YAML→JSON→YAML feedback loops
	const suppressYamlSyncRef = useRef(false);

	/**
	 * Persist current history state to localStorage.
	 */
	const persistHistory = useCallback((formName: string) => {
		if (historyRef.current) {
			saveHistory(formName, historyRef.current.serialize());
		}
	}, []);

	/**
	 * Initialize or reset the history manager for a schema.
	 * Attempts to load saved history for the given form first.
	 */
	const initHistory = useCallback((schema: SchemaComponent | null, formName?: string) => {
		const base = schema || EMPTY_SCHEMA;
		historyRef.current = createHistoryManager(base);

		// Try to restore saved history
		if (formName) {
			const saved = loadHistory(formName);
			if (saved && saved.entries.length > 0) {
				historyRef.current.restore(saved);
				// Use the schema from the restored history position
				const restoredSchema = historyRef.current.getCurrentSchema();
				setSchemaJson(restoredSchema);
				setHistoryState(historyRef.current.getState());
				return;
			}
		}

		setSchemaJson(schema);
		setHistoryState(historyRef.current.getState());
	}, []);

	// Load forms and select the first one on initial render
	useEffect(() => {
		let isActive = true;

		queueMicrotask(() => {
			if (!isActive) return;

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

			// Initialize JSON state from saved YAML (try restoring history)
			const parsed = yamlToSchema(yamlContent);
			initHistory(parsed, firstForm);

			// Load saved chat messages for this form
			setChatMessages(loadChatMessages(firstForm));
		});

		return () => {
			isActive = false;
		};
	}, [initHistory]);

	// Save content when yamlInput changes for the selected form
	useEffect(() => {
		if (selectedForm) {
			saveFormContent(selectedForm, yamlInput);
		}
	}, [yamlInput, selectedForm]);

	// Parse YAML and update form config
	const { formConfig, error } = useMemo((): {
		formConfig: FormConfig | null;
		error: string | null;
	} => {
		if (!yamlInput) {
			return {
				formConfig: null,
				error: "",
			};
		}

		try {
			const parsedYaml = yaml.load(yamlInput);
			const { config, errors } = parseRootFormSchema(parsedYaml);

			if (config) {
				return {
					formConfig: config,
					error: null,
				};
			}

			if (errors) {
				return {
					formConfig: null,
					error: JSON.stringify(errors.flatten(), null, 2),
				};
			}

			return {
				formConfig: null,
				error: "An unknown parsing error occurred.",
			};
		} catch (error) {
			return {
				formConfig: null,
				error: error instanceof Error ? error.message : String(error),
			};
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
						persistHistory(selectedForm);
					}
				} else if (parsed && !schemaJson) {
					// First time having a schema
					initHistory(parsed, selectedForm);
				}
			}
			setActiveTab(tab);
		},
		[activeTab, yamlInput, schemaJson, selectedForm, initHistory, persistHistory],
	);

	// Reset page when selected form changes
	useEffect(() => {
		queueMicrotask(() => {
			setCurrentPage(0);
			setFormMeta(null);
		});
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
				persistHistory(selectedForm);
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
		[schemaJson, selectedForm, persistHistory],
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
			persistHistory(selectedForm);
			requestAnimationFrame(() => {
				suppressYamlSyncRef.current = false;
			});
		}
	}, [selectedForm, persistHistory]);

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
			persistHistory(selectedForm);
			requestAnimationFrame(() => {
				suppressYamlSyncRef.current = false;
			});
		}
	}, [selectedForm, persistHistory]);

	/**
	 * Export the current schema as Fillout JSON and trigger a download.
	 */
	const handleExportFillout = useCallback(() => {
		// Prefer the JSON schema if available; fall back to parsing YAML
		const schema = schemaJson ?? yamlToSchema(yamlInput);
		if (!schema) {
			alert("Cannot export: the current schema is empty or invalid.");
			return;
		}

		const { output, diagnostics } = exportToFillout(schema);

		// Trigger download
		const filename = `${selectedForm || "form"}-fillout.json`;
		const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		// Show diagnostics dialog if there are any
		if (diagnostics.length > 0) {
			setExportFilename(filename);
			setExportDiagnostics(diagnostics);
			setExportDialogOpen(true);
		}
	}, [schemaJson, yamlInput, selectedForm]);

	const handleNewForm = () => {
		const name = prompt("Enter new form name:");

		if (name && !forms.includes(name)) {
			const emptySchema = "";

			saveFormContent(name, emptySchema);
			setForms([...forms, name]);
			setSelectedForm(name);
			setYamlInput(emptySchema);
			setChatMessages([]);
			initHistory(null, name);
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
			setChatMessages(loadChatMessages(name));
			initHistory(yamlToSchema(content), name);
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
			deleteChatMessages(selectedForm);
			deleteHistory(selectedForm);

			const remainingForms = forms.filter((f) => f !== selectedForm);
			setForms(remainingForms);

			if (remainingForms.length > 0) {
				const newSelectedForm = remainingForms[0];
				setSelectedForm(newSelectedForm);
				const content = getFormContent(newSelectedForm) || "";
				setYamlInput(content);
				setChatMessages(loadChatMessages(newSelectedForm));
				initHistory(yamlToSchema(content), newSelectedForm);
			} else {
				const name = "sample-form";
				saveFormContent(name, defaultForm);
				setForms([name]);
				setSelectedForm(name);
				setYamlInput(defaultForm);
				setChatMessages([]);
				initHistory(yamlToSchema(defaultForm), name);
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

	const pageComponents = useMemo(() => {
		if (formConfig?.type === "form" && Array.isArray(formConfig.children)) {
			return formConfig.children.filter((child) => child?.type === "page");
		}
		return [];
	}, [formConfig]);

	const totalPages = pageComponents.length;
	const pageTitle =
		(pageComponents[currentPage] as { title?: string } | undefined)?.title ??
		formConfig?.title ??
		formMeta?.formTitle ??
		"Untitled Form";

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
				currentPage={currentPage}
				totalPages={totalPages}
				pageTitle={pageTitle}
				onPrevPage={handlePrevPage}
				onNextPage={handleNextPage}
				onOpenSettings={() => setSettingsOpen(true)}
				onExportFillout={handleExportFillout}
			/>
			<div className="flex flex-row flex-grow min-h-0">
				<FormSidebar
					forms={forms}
					selectedForm={selectedForm}
					onSelectForm={handleSelectForm}
					onNewForm={handleNewForm}
					onDeleteForm={handleDeleteForm}
				/>
				<Group orientation="horizontal" className="flex-grow min-w-0">
					<Panel id="editorPanel" defaultSize={"50%"} minSize={100}>
						<EditorPane
							schema={yamlInput}
							onSchemaChange={setYamlInput}
							activeTab={activeTab}
							onTabChange={handleTabChange}
							onOpenSettings={() => setSettingsOpen(true)}
							formId={selectedForm}
							initialMessages={chatMessages}
							jsonlMode={jsonlModeProps}
							history={historyProps}
						/>
					</Panel>
					<Separator className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors" />
					<Panel id="previewPanel" defaultSize={"50%"} minSize={100}>
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
			</div>
			<SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
			<ExportDiagnosticsDialog
				open={exportDialogOpen}
				onOpenChange={setExportDialogOpen}
				diagnostics={exportDiagnostics}
				filename={exportFilename}
			/>
		</div>
	);
}
