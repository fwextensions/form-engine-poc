import { createHash } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
	buildOpenRouterAuthUrl,
	completeOpenRouterLogin,
	createCodeChallenge,
	OPENROUTER_CALLBACK_PATH,
} from "../openrouter-auth";
import { getSettings, saveSettings } from "../settings";

const ORIGIN = "http://localhost:3000";
const CALLBACK = `${ORIGIN}${OPENROUTER_CALLBACK_PATH}`;

function okResponse(body: unknown) {
	return new Response(JSON.stringify(body), { status: 200 });
}

describe("OpenRouter PKCE login", () => {
	beforeEach(() => {
		// jsdom here has no localStorage; use an in-memory one.
		const store = new Map<string, string>();
		vi.stubGlobal("localStorage", {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: (key: string, value: string) => store.set(key, value),
			removeItem: (key: string) => store.delete(key),
			clear: () => store.clear(),
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("computes the S256 challenge as base64url(sha256(verifier))", async () => {
		const verifier = "a-test-verifier_with~unreserved.chars-0123456789";
		const expected = createHash("sha256").update(verifier).digest("base64url");
		expect(await createCodeChallenge(verifier)).toBe(expected);
	});

	it("builds an auth URL with an S256 challenge and the callback route", async () => {
		const url = new URL(await buildOpenRouterAuthUrl(ORIGIN, "popup"));
		expect(url.origin + url.pathname).toBe("https://openrouter.ai/auth");
		expect(url.searchParams.get("callback_url")).toBe(CALLBACK);
		expect(url.searchParams.get("code_challenge_method")).toBe("S256");
		expect(url.searchParams.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/);
	});

	it("exchanges the code with the stored verifier and saves the key", async () => {
		saveSettings({ provider: "anthropic", anthropicModel: "keep-me" });
		const authUrl = new URL(await buildOpenRouterAuthUrl(ORIGIN, "popup"));
		const challenge = authUrl.searchParams.get("code_challenge");

		const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
			const body = JSON.parse(String(init?.body));
			expect(await createCodeChallenge(body.code_verifier)).toBe(challenge);
			expect(body).toMatchObject({ code: "abc", code_challenge_method: "S256" });
			return okResponse({ key: "sk-or-v1-test" });
		});

		const result = await completeOpenRouterLogin(`${CALLBACK}?code=abc`, fetchMock as typeof fetch);

		expect(result).toEqual({ mode: "popup" });
		expect(fetchMock).toHaveBeenCalledWith("https://openrouter.ai/api/v1/auth/keys", expect.anything());
		expect(getSettings()).toMatchObject({
			provider: "openrouter",
			apiKey: "sk-or-v1-test",
			anthropicModel: "keep-me",
		});
	});

	it("can only be completed once", async () => {
		await buildOpenRouterAuthUrl(ORIGIN, "redirect");
		const fetchMock = vi.fn(async () => okResponse({ key: "sk-or-v1-test" }));
		await completeOpenRouterLogin(`${CALLBACK}?code=abc`, fetchMock as typeof fetch);
		await expect(
			completeOpenRouterLogin(`${CALLBACK}?code=abc`, fetchMock as typeof fetch),
		).rejects.toThrow(/expired/);
	});

	it("rejects a callback without a code", async () => {
		await buildOpenRouterAuthUrl(ORIGIN, "popup");
		await expect(completeOpenRouterLogin(CALLBACK)).rejects.toThrow(/authorization code/);
	});

	it("reports a failed exchange", async () => {
		await buildOpenRouterAuthUrl(ORIGIN, "popup");
		const fetchMock = vi.fn(async () => new Response("{}", { status: 403 }));
		await expect(
			completeOpenRouterLogin(`${CALLBACK}?code=abc`, fetchMock as typeof fetch),
		).rejects.toThrow(/HTTP 403/);
		expect(getSettings().apiKey).toBeUndefined();
	});
});
