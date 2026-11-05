import { APICallError } from "ai";

const FALLBACK = "An error occurred.";

/**
 * Turns an error raised inside a `streamText` stream into the message the
 * chat shows the user.
 *
 * Provider calls happen lazily while the response streams, so an expired
 * key or a rate limit never reaches the route's try/catch: it arrives as an
 * error part in the stream, which the AI SDK masks as "An error occurred."
 * by default. This keeps the masking for unknown errors but passes the
 * provider's own explanation through for API errors.
 */
export function describeStreamError(error: unknown): string {
	if (APICallError.isInstance(error)) {
		const detail = providerMessage(error.responseBody) ?? error.message?.trim();
		const status = error.statusCode;

		if (status === 401 || status === 403) {
			// Some providers (Bedrock) already say "Authentication failed"; do not say it twice.
			if (detail && /^authentication failed/i.test(detail)) return detail;
			return `Authentication failed: ${detail || "please check your API key or credentials."}`;
		}
		if (status === 429) {
			return `Rate limit exceeded: ${detail || "please wait before retrying."}`;
		}
		return `API error${status ? ` ${status}` : ""}: ${detail || FALLBACK}`;
	}

	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}

	return FALLBACK;
}

/** Extracts the human-readable message from a provider's JSON error body. */
function providerMessage(body: string | undefined): string | undefined {
	if (!body) return undefined;
	try {
		const parsed = JSON.parse(body);
		const candidates = [parsed?.Message, parsed?.message, parsed?.error?.message, parsed?.error];
		const found = candidates.find((c) => typeof c === "string" && c.trim().length > 0);
		return found?.trim();
	} catch {
		const text = body.trim();
		return text.length > 0 && text.length <= 300 ? text : undefined;
	}
}
