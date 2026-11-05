import { describe, it, expect } from "vitest";
import { APICallError } from "ai";
import { describeStreamError } from "../stream-error";

function apiError(statusCode: number | undefined, responseBody?: string, message = "Request failed") {
	return new APICallError({
		message,
		url: "https://example.test/v1",
		requestBodyValues: {},
		statusCode,
		responseBody,
	});
}

describe("describeStreamError", () => {
	it("passes the provider's explanation through for an expired key", () => {
		const bedrock = apiError(403, '{"Message":"Authentication failed: Please make sure your API Key is valid."}');
		// Bedrock's own text already starts with "Authentication failed", so it is not prefixed again.
		expect(describeStreamError(bedrock)).toBe("Authentication failed: Please make sure your API Key is valid.");
	});

	it("reads lowercase and nested message fields", () => {
		expect(describeStreamError(apiError(401, '{"error":{"message":"Incorrect API key provided"}}'))).toBe("Authentication failed: Incorrect API key provided");
		expect(describeStreamError(apiError(429, '{"message":"Too many requests"}'))).toBe("Rate limit exceeded: Too many requests");
	});

	it("falls back to generic guidance when the body has nothing useful", () => {
		expect(describeStreamError(apiError(401, "", ""))).toBe("Authentication failed: please check your API key or credentials.");
		expect(describeStreamError(apiError(500, undefined, "Internal error"))).toBe("API error 500: Internal error");
	});

	it("uses a plain text body when it is short", () => {
		expect(describeStreamError(apiError(400, "model not found"))).toBe("API error 400: model not found");
	});

	it("keeps ordinary error messages and masks unknown values", () => {
		expect(describeStreamError(new Error("Network down"))).toBe("Network down");
		expect(describeStreamError("boom")).toBe("An error occurred.");
		expect(describeStreamError(undefined)).toBe("An error occurred.");
	});
});
