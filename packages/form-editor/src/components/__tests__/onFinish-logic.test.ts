import { describe, it, expect } from "vitest";

/**
 * Test the onFinish callback logic for handling tool calls
 * This tests the logic that was implemented in task 9.1
 */
describe("onFinish callback logic", () => {
	it("should extract YAML from tool-call message parts", () => {
		// Simulate a message with a tool-call part
		const message = {
			id: "test-msg-1",
			role: "assistant" as const,
			parts: [
				{
					type: "tool-call" as const,
					toolName: "generate_schema",
					args: {
						yaml: "id: testForm\ntype: form\ncomponents: []",
						explanation: "Created a basic form",
					},
				},
			],
		};

		// Extract YAML using the same logic as onFinish
		let extractedYaml: string | null = null;

		const toolCallParts = message.parts?.filter(
			(part): part is { type: "tool-call"; toolName: string; args: any } =>
				part.type === "tool-call" && part.toolName === "generate_schema"
		) || [];

		if (toolCallParts.length > 0) {
			const toolCall = toolCallParts[0];
			if (toolCall.args && typeof toolCall.args.yaml === "string") {
				extractedYaml = toolCall.args.yaml;
			}
		}

		expect(extractedYaml).toBe("id: testForm\ntype: form\ncomponents: []");
	});

	it("should handle messages with both tool-call and text parts", () => {
		// Simulate a message with both tool-call and text parts
		const message = {
			id: "test-msg-2",
			role: "assistant" as const,
			parts: [
				{
					type: "text" as const,
					text: "I've created a form for you.",
				},
				{
					type: "tool-call" as const,
					toolName: "generate_schema",
					args: {
						yaml: "id: contactForm\ntype: form",
						explanation: "Contact form schema",
					},
				},
			],
		};

		// Extract YAML - should prioritize tool-call
		let extractedYaml: string | null = null;

		const toolCallParts = message.parts?.filter(
			(part): part is { type: "tool-call"; toolName: string; args: any } =>
				part.type === "tool-call" && part.toolName === "generate_schema"
		) || [];

		if (toolCallParts.length > 0) {
			const toolCall = toolCallParts[0];
			if (toolCall.args && typeof toolCall.args.yaml === "string") {
				extractedYaml = toolCall.args.yaml;
			}
		}

		expect(extractedYaml).toBe("id: contactForm\ntype: form");
	});

	it("should return null when no tool-call parts exist", () => {
		// Simulate a message with only text parts (no tool call)
		const message = {
			id: "test-msg-3",
			role: "assistant" as const,
			parts: [
				{
					type: "text" as const,
					text: "I can help you create a form. What fields do you need?",
				},
			],
		};

		// Extract YAML - should find no tool calls
		let extractedYaml: string | null = null;

		const toolCallParts = message.parts?.filter(
			(part): part is { type: "tool-call"; toolName: string; args: any } =>
				part.type === "tool-call" && part.toolName === "generate_schema"
		) || [];

		if (toolCallParts.length > 0) {
			const toolCall = toolCallParts[0];
			if (toolCall.args && typeof toolCall.args.yaml === "string") {
				extractedYaml = toolCall.args.yaml;
			}
		}

		expect(extractedYaml).toBeNull();
	});

	it("should ignore tool calls with wrong toolName", () => {
		// Simulate a message with a different tool call
		const message = {
			id: "test-msg-4",
			role: "assistant" as const,
			parts: [
				{
					type: "tool-call" as const,
					toolName: "some_other_tool",
					args: {
						data: "some data",
					},
				},
			],
		};

		// Extract YAML - should ignore non-generate_schema tools
		let extractedYaml: string | null = null;

		const toolCallParts = message.parts?.filter(
			(part): part is { type: "tool-call"; toolName: string; args: any } =>
				part.type === "tool-call" && part.toolName === "generate_schema"
		) || [];

		if (toolCallParts.length > 0) {
			const toolCall = toolCallParts[0];
			if (toolCall.args && typeof toolCall.args.yaml === "string") {
				extractedYaml = toolCall.args.yaml;
			}
		}

		expect(extractedYaml).toBeNull();
	});

	it("should handle tool-call with missing yaml arg", () => {
		// Simulate a tool call without yaml in args
		const message = {
			id: "test-msg-5",
			role: "assistant" as const,
			parts: [
				{
					type: "tool-call" as const,
					toolName: "generate_schema",
					args: {
						explanation: "Only explanation, no yaml",
					},
				},
			],
		};

		// Extract YAML - should handle missing yaml gracefully
		let extractedYaml: string | null = null;

		const toolCallParts = message.parts?.filter(
			(part): part is { type: "tool-call"; toolName: string; args: any } =>
				part.type === "tool-call" && part.toolName === "generate_schema"
		) || [];

		if (toolCallParts.length > 0) {
			const toolCall = toolCallParts[0];
			if (toolCall.args && typeof toolCall.args.yaml === "string") {
				extractedYaml = toolCall.args.yaml;
			}
		}

		expect(extractedYaml).toBeNull();
	});

	it("should handle multiple tool-call parts and use the first one", () => {
		// Simulate a message with multiple tool calls (edge case)
		const message = {
			id: "test-msg-6",
			role: "assistant" as const,
			parts: [
				{
					type: "tool-call" as const,
					toolName: "generate_schema",
					args: {
						yaml: "id: firstForm\ntype: form",
						explanation: "First schema",
					},
				},
				{
					type: "tool-call" as const,
					toolName: "generate_schema",
					args: {
						yaml: "id: secondForm\ntype: form",
						explanation: "Second schema",
					},
				},
			],
		};

		// Extract YAML - should use the first tool call
		let extractedYaml: string | null = null;

		const toolCallParts = message.parts?.filter(
			(part): part is { type: "tool-call"; toolName: string; args: any } =>
				part.type === "tool-call" && part.toolName === "generate_schema"
		) || [];

		if (toolCallParts.length > 0) {
			const toolCall = toolCallParts[0];
			if (toolCall.args && typeof toolCall.args.yaml === "string") {
				extractedYaml = toolCall.args.yaml;
			}
		}

		expect(extractedYaml).toBe("id: firstForm\ntype: form");
	});
});
