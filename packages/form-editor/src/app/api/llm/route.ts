import { NextRequest, NextResponse } from "next/server";

/**
 * API route to proxy LLM requests to avoid CORS issues.
 * This endpoint accepts requests from the client and forwards them to the LLM provider.
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { provider, apiKey, model, messages, stream } = body;

		if (!provider || !apiKey) {
			return NextResponse.json(
				{ error: "Provider and API key are required" },
				{ status: 400 }
			);
		}

		// Determine the API endpoint based on provider
		let apiUrl: string;
		let headers: Record<string, string>;
		let requestBody: any;

		if (provider === "anthropic") {
			apiUrl = "https://api.anthropic.com/v1/messages";
			headers = {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
			};
			
			// Separate system messages from conversation messages
			const systemMessages = messages.filter((m: any) => m.role === "system");
			const conversationMessages = messages.filter((m: any) => m.role !== "system");
			const systemPrompt = systemMessages.map((m: any) => m.content).join("\n\n");
			
			requestBody = {
				model: model || "claude-haiku-4-5-20251001",
				messages: conversationMessages,
				max_tokens: 4096,
				stream: stream || false,
				...(systemPrompt && { system: systemPrompt }),
			};
		} else if (provider === "openai") {
			apiUrl = "https://api.openai.com/v1/chat/completions";
			headers = {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			};
			requestBody = {
				model: model || "gpt-4",
				messages,
				stream: stream || false,
			};
		} else {
			return NextResponse.json(
				{ error: "Unsupported provider" },
				{ status: 400 }
			);
		}

		// Make the request to the LLM provider
		const response = await fetch(apiUrl, {
			method: "POST",
			headers,
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorText = await response.text();
			return NextResponse.json(
				{ error: `LLM API error: ${errorText}` },
				{ status: response.status }
			);
		}

		// Handle streaming responses
		if (stream) {
			// For streaming, we need to pipe the response
			return new NextResponse(response.body, {
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache",
					Connection: "keep-alive",
				},
			});
		}

		// For non-streaming, return the JSON response
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("LLM proxy error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
