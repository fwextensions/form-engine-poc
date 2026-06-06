/**
 * Property-Based Tests for EditorPane Tab State Preservation
 *
 * Tests that YAML schema state is preserved when switching between tabs
 * across all valid schema strings and tab switching sequences.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import * as fc from "fast-check";
import EditorPane from "../EditorPane";

// Mock Monaco Editor
vi.mock("@monaco-editor/react", () => ({
	default: ({ value, onChange }: any) => (
		<textarea
			data-testid="monaco-editor"
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
	),
}));

// Mock AIChatJsonl component
vi.mock("../AIChatJsonl", () => ({
	default: () => <div data-testid="ai-chat" />,
}));

// Configure fast-check
fc.configureGlobal({
	numRuns: 100,
});

const defaultJsonlMode = {
	currentSchema: null,
	onSchemaChange: vi.fn(),
};

const baseProps = {
	onSchemaChange: vi.fn(),
	onTabChange: vi.fn(),
	onOpenSettings: vi.fn(),
	formId: "test-form",
	initialMessages: [] as any[],
	jsonlMode: defaultJsonlMode,
};

describe("EditorPane - Property-Based Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	// Generator for tab types
	const tabArb = fc.constantFrom<"yaml" | "ai">("yaml", "ai");

	// Generator for valid schema strings
	const schemaArb = fc.oneof(
		fc.constant(""),
		fc.constant("id: test"),
		fc.constant("id: myForm\ntype: form"),
		fc.string({ maxLength: 200 }),
	);

	describe("YAML editor schema preservation", () => {
		it("preserves schema value in YAML editor across any schema string", () => {
			fc.assert(
				fc.property(schemaArb, (schema) => {
					const { container, unmount } = render(
						<EditorPane {...baseProps} schema={schema} activeTab="yaml" />
					);

					const yamlEditor = container.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
					expect(yamlEditor).toBeTruthy();
					expect(yamlEditor?.value).toBe(schema);

					unmount();
				})
			);
		});

		it("preserves YAML editor value after switching to AI tab and back", () => {
			fc.assert(
				fc.property(schemaArb, (schema) => {
					// Start on YAML tab
					const { container: c1, unmount: u1 } = render(
						<EditorPane {...baseProps} schema={schema} activeTab="yaml" />
					);
					const yamlEditor = c1.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
					expect(yamlEditor?.value).toBe(schema);
					u1();

					// Switch to AI tab (schema prop unchanged)
					const { unmount: u2 } = render(
						<EditorPane {...baseProps} schema={schema} activeTab="ai" />
					);
					u2();

					// Switch back to YAML tab
					const { container: c3, unmount: u3 } = render(
						<EditorPane {...baseProps} schema={schema} activeTab="yaml" />
					);
					const yamlEditorAfter = c3.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
					expect(yamlEditorAfter?.value).toBe(schema);
					u3();
				})
			);
		});

		it("preserves schema through any sequence of tab switches", () => {
			fc.assert(
				fc.property(
					schemaArb,
					fc.array(tabArb, { minLength: 2, maxLength: 10 }),
					(schema, tabSequence) => {
						for (const tab of tabSequence) {
							const { container, unmount } = render(
								<EditorPane {...baseProps} schema={schema} activeTab={tab} />
							);

							if (tab === "yaml") {
								const yamlEditor = container.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
								expect(yamlEditor?.value).toBe(schema);
							}

							unmount();
						}
					}
				)
			);
		});

		it("preserves large schemas through tab switches", () => {
			fc.assert(
				fc.property(
					fc.string({ minLength: 500, maxLength: 2000 }),
					fc.array(tabArb, { minLength: 2, maxLength: 5 }),
					(largeSchema, tabSequence) => {
						for (const tab of tabSequence) {
							const { container, unmount } = render(
								<EditorPane {...baseProps} schema={largeSchema} activeTab={tab} />
							);

							if (tab === "yaml") {
								const yamlEditor = container.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
								expect(yamlEditor?.value).toBe(largeSchema);
							}

							unmount();
						}
					}
				)
			);
		});

		it("preserves empty schema through tab switches", () => {
			fc.assert(
				fc.property(
					fc.array(tabArb, { minLength: 2, maxLength: 5 }),
					(tabSequence) => {
						for (const tab of tabSequence) {
							const { container, unmount } = render(
								<EditorPane {...baseProps} schema="" activeTab={tab} />
							);

							if (tab === "yaml") {
								const yamlEditor = container.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
								expect(yamlEditor?.value).toBe("");
							}

							unmount();
						}
					}
				)
			);
		});
	});
});
