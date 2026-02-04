/**
 * Property-Based Tests for EditorPane Tab State Preservation
 * 
 * Feature: llm-integration, Property 13: Tab Switch State Preservation
 * Validates: Requirements 4.4
 * 
 * Tests that schema state is preserved when switching between YAML and AI tabs
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

// Mock AIChat component
vi.mock("../AIChat", () => ({
	default: ({ currentSchema, onSchemaGenerated, onOpenSettings }: any) => (
		<div data-testid="ai-chat">
			<div data-testid="current-schema">{currentSchema}</div>
			<button
				data-testid="generate-schema"
				onClick={() => onSchemaGenerated("generated: schema")}
			>
				Generate
			</button>
			<button data-testid="open-settings" onClick={onOpenSettings}>
				Settings
			</button>
		</div>
	),
}));

// Configure fast-check
fc.configureGlobal({
	numRuns: 100,
});

describe("EditorPane - Property-Based Tests", () => {
	const mockOnSchemaChange = vi.fn();
	const mockOnTabChange = vi.fn();
	const mockOnOpenSettings = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	describe("Property 13: Tab Switch State Preservation", () => {
		/**
		 * **Validates: Requirements 4.4**
		 * 
		 * For any schema state in the editor, switching between YAML and AI tabs
		 * and back SHALL preserve the exact schema content.
		 */

		// Generator for tab types
		const tabArb = fc.constantFrom<"yaml" | "ai">("yaml", "ai");

		// Generator for valid YAML-like schema strings
		const schemaArb = fc.oneof(
			// Empty schema
			fc.constant(""),
			// Simple schemas
			fc.constant("id: test"),
			fc.constant("type: form"),
			// Multi-line schemas
			fc.constant("id: myForm\ntype: form"),
			fc.constant("id: contact\ntype: form\nchildren:\n  - id: name\n    type: text"),
			// Arbitrary strings (to test any content)
			fc.string({ maxLength: 200 }),
			// Strings with special characters
			fc.string({ minLength: 0, maxLength: 200 }),
		);

		it("should preserve schema when switching from YAML to AI tab", () => {
			fc.assert(
				fc.property(
					schemaArb,
					(schema) => {
						// Render with YAML tab active
						const { unmount, container } = render(
							<EditorPane
								schema={schema}
								onSchemaChange={mockOnSchemaChange}
								activeTab="yaml"
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify schema in YAML tab
						const yamlEditor = container.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
						expect(yamlEditor).toBeTruthy();
						expect(yamlEditor?.value).toBe(schema);

						unmount();

						// Switch to AI tab
						const { container: container2, unmount: unmount2 } = render(
							<EditorPane
								schema={schema}
								onSchemaChange={mockOnSchemaChange}
								activeTab="ai"
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify schema is passed to AI tab
						const currentSchemaElement = container2.querySelector('[data-testid="current-schema"]');
						expect(currentSchemaElement).toBeTruthy();
						expect(currentSchemaElement?.textContent).toBe(schema);

						unmount2();
					}
				)
			);
		});

		it("should preserve schema when switching from AI to YAML tab", () => {
			fc.assert(
				fc.property(
					schemaArb,
					(schema) => {
						// Render with AI tab active
						const { unmount, container } = render(
							<EditorPane
								schema={schema}
								onSchemaChange={mockOnSchemaChange}
								activeTab="ai"
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify schema in AI tab
						const currentSchemaElement = container.querySelector('[data-testid="current-schema"]');
						expect(currentSchemaElement).toBeTruthy();
						expect(currentSchemaElement?.textContent).toBe(schema);

						unmount();

						// Switch to YAML tab
						const { container: container2, unmount: unmount2 } = render(
							<EditorPane
								schema={schema}
								onSchemaChange={mockOnSchemaChange}
								activeTab="yaml"
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify schema is preserved in YAML tab
						const yamlEditor = container2.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
						expect(yamlEditor).toBeTruthy();
						expect(yamlEditor?.value).toBe(schema);

						unmount2();
					}
				)
			);
		});

		it("should preserve schema through multiple tab switches", () => {
			fc.assert(
				fc.property(
					schemaArb,
					fc.array(tabArb, { minLength: 2, maxLength: 10 }),
					(schema, tabSequence) => {
						// Perform multiple tab switches
						for (const tab of tabSequence) {
							const { container, unmount } = render(
								<EditorPane
									schema={schema}
									onSchemaChange={mockOnSchemaChange}
									activeTab={tab}
									onTabChange={mockOnTabChange}
									onOpenSettings={mockOnOpenSettings}
								/>
							);

							// Verify schema is preserved in the current tab
							if (tab === "yaml") {
								const yamlEditor = container.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
								expect(yamlEditor).toBeTruthy();
								expect(yamlEditor?.value).toBe(schema);
							} else {
								const currentSchemaElement = container.querySelector('[data-testid="current-schema"]');
								expect(currentSchemaElement).toBeTruthy();
								expect(currentSchemaElement?.textContent).toBe(schema);
							}

							unmount();
						}
					}
				)
			);
		});

		it("should preserve schema with whitespace and special characters", () => {
			fc.assert(
				fc.property(
					fc.string({ minLength: 0, maxLength: 200 }),
					tabArb,
					tabArb,
					(schema, firstTab, secondTab) => {
						// Start with first tab
						const { container: c1, unmount: u1 } = render(
							<EditorPane
								schema={schema}
								onSchemaChange={mockOnSchemaChange}
								activeTab={firstTab}
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify in first tab
						if (firstTab === "yaml") {
							const yamlEditor = c1.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
							expect(yamlEditor?.value).toBe(schema);
						} else {
							const currentSchemaElement = c1.querySelector('[data-testid="current-schema"]');
							expect(currentSchemaElement?.textContent).toBe(schema);
						}

						u1();

						// Switch to second tab
						const { container: c2, unmount: u2 } = render(
							<EditorPane
								schema={schema}
								onSchemaChange={mockOnSchemaChange}
								activeTab={secondTab}
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify in second tab
						if (secondTab === "yaml") {
							const yamlEditor = c2.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
							expect(yamlEditor?.value).toBe(schema);
						} else {
							const currentSchemaElement = c2.querySelector('[data-testid="current-schema"]');
							expect(currentSchemaElement?.textContent).toBe(schema);
						}

						u2();

						// Switch back to first tab
						const { container: c3, unmount: u3 } = render(
							<EditorPane
								schema={schema}
								onSchemaChange={mockOnSchemaChange}
								activeTab={firstTab}
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify schema is preserved
						if (firstTab === "yaml") {
							const yamlEditor = c3.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
							expect(yamlEditor?.value).toBe(schema);
						} else {
							const currentSchemaElement = c3.querySelector('[data-testid="current-schema"]');
							expect(currentSchemaElement?.textContent).toBe(schema);
						}

						u3();
					}
				)
			);
		});

		it("should preserve empty schema through tab switches", () => {
			fc.assert(
				fc.property(
					fc.array(tabArb, { minLength: 2, maxLength: 5 }),
					(tabSequence) => {
						const emptySchema = "";
						
						// Perform multiple tab switches
						for (const tab of tabSequence) {
							const { container, unmount } = render(
								<EditorPane
									schema={emptySchema}
									onSchemaChange={mockOnSchemaChange}
									activeTab={tab}
									onTabChange={mockOnTabChange}
									onOpenSettings={mockOnOpenSettings}
								/>
							);

							// Verify empty schema is preserved
							if (tab === "yaml") {
								const yamlEditor = container.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
								expect(yamlEditor?.value).toBe("");
							} else {
								const currentSchemaElement = container.querySelector('[data-testid="current-schema"]');
								expect(currentSchemaElement?.textContent).toBe("");
							}

							unmount();
						}
					}
				)
			);
		});

		it("should preserve schema with newlines and indentation", () => {
			fc.assert(
				fc.property(
					fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
					fc.nat({ max: 4 }),
					(lines, indentLevel) => {
						// Create a schema with indentation
						const indent = "  ".repeat(indentLevel);
						const schema = lines.map(line => `${indent}${line}`).join("\n");
						
						// Start with YAML tab
						const { container: c1, unmount: u1 } = render(
							<EditorPane
								schema={schema}
								onSchemaChange={mockOnSchemaChange}
								activeTab="yaml"
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify in YAML tab
						const yamlEditor1 = c1.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
						expect(yamlEditor1?.value).toBe(schema);

						u1();

						// Switch to AI tab
						const { container: c2, unmount: u2 } = render(
							<EditorPane
								schema={schema}
								onSchemaChange={mockOnSchemaChange}
								activeTab="ai"
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify in AI tab
						const currentSchemaElement = c2.querySelector('[data-testid="current-schema"]');
						expect(currentSchemaElement?.textContent).toBe(schema);

						u2();

						// Switch back to YAML tab
						const { container: c3, unmount: u3 } = render(
							<EditorPane
								schema={schema}
								onSchemaChange={mockOnSchemaChange}
								activeTab="yaml"
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify schema is still preserved with exact formatting
						const yamlEditor3 = c3.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
						expect(yamlEditor3?.value).toBe(schema);

						u3();
					}
				)
			);
		});

		it("should preserve schema regardless of starting tab", () => {
			fc.assert(
				fc.property(
					schemaArb,
					tabArb,
					(schema, startingTab) => {
						// Render with starting tab
						const { container: c1, unmount: u1 } = render(
							<EditorPane
								schema={schema}
								onSchemaChange={mockOnSchemaChange}
								activeTab={startingTab}
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify schema in starting tab
						if (startingTab === "yaml") {
							const yamlEditor = c1.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
							expect(yamlEditor?.value).toBe(schema);
						} else {
							const currentSchemaElement = c1.querySelector('[data-testid="current-schema"]');
							expect(currentSchemaElement?.textContent).toBe(schema);
						}

						u1();

						// Switch to other tab
						const otherTab = startingTab === "yaml" ? "ai" : "yaml";
						const { container: c2, unmount: u2 } = render(
							<EditorPane
								schema={schema}
								onSchemaChange={mockOnSchemaChange}
								activeTab={otherTab}
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify schema in other tab
						if (otherTab === "yaml") {
							const yamlEditor = c2.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
							expect(yamlEditor?.value).toBe(schema);
						} else {
							const currentSchemaElement = c2.querySelector('[data-testid="current-schema"]');
							expect(currentSchemaElement?.textContent).toBe(schema);
						}

						u2();

						// Switch back to starting tab
						const { container: c3, unmount: u3 } = render(
							<EditorPane
								schema={schema}
								onSchemaChange={mockOnSchemaChange}
								activeTab={startingTab}
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify schema is still preserved
						if (startingTab === "yaml") {
							const yamlEditor = c3.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
							expect(yamlEditor?.value).toBe(schema);
						} else {
							const currentSchemaElement = c3.querySelector('[data-testid="current-schema"]');
							expect(currentSchemaElement?.textContent).toBe(schema);
						}

						u3();
					}
				)
			);
		});

		it("should preserve large schemas through tab switches", () => {
			fc.assert(
				fc.property(
					fc.string({ minLength: 500, maxLength: 2000 }),
					fc.array(tabArb, { minLength: 2, maxLength: 5 }),
					(largeSchema, tabSequence) => {
						// Perform multiple tab switches
						for (const tab of tabSequence) {
							const { container, unmount } = render(
								<EditorPane
									schema={largeSchema}
									onSchemaChange={mockOnSchemaChange}
									activeTab={tab}
									onTabChange={mockOnTabChange}
									onOpenSettings={mockOnOpenSettings}
								/>
							);

							// Verify large schema is preserved
							if (tab === "yaml") {
								const yamlEditor = container.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
								expect(yamlEditor?.value).toBe(largeSchema);
							} else {
								const currentSchemaElement = container.querySelector('[data-testid="current-schema"]');
								expect(currentSchemaElement?.textContent).toBe(largeSchema);
							}

							unmount();
						}
					}
				)
			);
		});

		it("should preserve schema with unicode characters through tab switches", () => {
			fc.assert(
				fc.property(
					fc.string({ minLength: 1, maxLength: 100 }),
					(unicodeSchema) => {
						// Start with YAML tab
						const { container: c1, unmount: u1 } = render(
							<EditorPane
								schema={unicodeSchema}
								onSchemaChange={mockOnSchemaChange}
								activeTab="yaml"
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify in YAML tab
						const yamlEditor1 = c1.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
						expect(yamlEditor1?.value).toBe(unicodeSchema);

						u1();

						// Switch to AI tab
						const { container: c2, unmount: u2 } = render(
							<EditorPane
								schema={unicodeSchema}
								onSchemaChange={mockOnSchemaChange}
								activeTab="ai"
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify in AI tab
						const currentSchemaElement = c2.querySelector('[data-testid="current-schema"]');
						expect(currentSchemaElement?.textContent).toBe(unicodeSchema);

						u2();

						// Switch back to YAML tab
						const { container: c3, unmount: u3 } = render(
							<EditorPane
								schema={unicodeSchema}
								onSchemaChange={mockOnSchemaChange}
								activeTab="yaml"
								onTabChange={mockOnTabChange}
								onOpenSettings={mockOnOpenSettings}
							/>
						);

						// Verify unicode schema is still preserved
						const yamlEditor3 = c3.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
						expect(yamlEditor3?.value).toBe(unicodeSchema);

						u3();
					}
				)
			);
		});

		it("should preserve schema identity through rapid tab switches", () => {
			fc.assert(
				fc.property(
					schemaArb,
					fc.array(tabArb, { minLength: 10, maxLength: 20 }),
					(schema, rapidTabSequence) => {
						// Perform rapid tab switches
						for (const tab of rapidTabSequence) {
							const { container, unmount } = render(
								<EditorPane
									schema={schema}
									onSchemaChange={mockOnSchemaChange}
									activeTab={tab}
									onTabChange={mockOnTabChange}
									onOpenSettings={mockOnOpenSettings}
								/>
							);

							// Verify schema is preserved
							if (tab === "yaml") {
								const yamlEditor = container.querySelector('[data-testid="monaco-editor"]') as HTMLTextAreaElement;
								expect(yamlEditor?.value).toBe(schema);
							} else {
								const currentSchemaElement = container.querySelector('[data-testid="current-schema"]');
								expect(currentSchemaElement?.textContent).toBe(schema);
							}

							unmount();
						}
					}
				)
			);
		});
	});
});
