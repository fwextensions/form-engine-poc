/**
 * "Connect OpenRouter" login using OpenRouter's OAuth PKCE flow.
 * https://openrouter.ai/docs/guides/overview/auth/oauth
 *
 * The login runs in a popup so the editor (and any unsaved YAML) stays put.
 * The popup lands on /auth/openrouter, exchanges the code for a user-scoped
 * API key, saves it to settings and closes. The editor picks the new key up
 * through the `storage` event (see subscribeToSettings).
 *
 * The key is created on the user's OpenRouter account and billed to their
 * credits; it never touches this app's server except per chat request, the
 * same as a pasted key.
 */

import { getSettings, saveSettings } from "@/lib/settings";

const AUTH_URL = "https://openrouter.ai/auth";
const KEY_EXCHANGE_URL = "https://openrouter.ai/api/v1/auth/keys";
export const OPENROUTER_CALLBACK_PATH = "/auth/openrouter";

// localStorage, not sessionStorage: the popup is a separate browsing context.
const PENDING_KEY = "form-editor-openrouter-pkce";
const PENDING_MAX_AGE_MS = 10 * 60 * 1000;

// No separate `state` value: the code is bound to our challenge, so a code
// from someone else's login fails the exchange with our verifier.
export type LoginMode = "popup" | "redirect";

interface PendingLogin {
	verifier: string;
	mode: LoginMode;
	createdAt: number;
}

function base64Url(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(byteLength = 32): string {
	return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export async function createCodeChallenge(verifier: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
	return base64Url(new Uint8Array(digest));
}

export async function buildOpenRouterAuthUrl(origin: string, mode: LoginMode): Promise<string> {
	const verifier = randomString();
	const pending: PendingLogin = { verifier, mode, createdAt: Date.now() };
	localStorage.setItem(PENDING_KEY, JSON.stringify(pending));

	const url = new URL(AUTH_URL);
	url.searchParams.set("callback_url", new URL(OPENROUTER_CALLBACK_PATH, origin).toString());
	url.searchParams.set("code_challenge", await createCodeChallenge(verifier));
	url.searchParams.set("code_challenge_method", "S256");
	return url.toString();
}

/**
 * Opens the OpenRouter login popup. Must be called from a click handler: the
 * window is opened synchronously (so it is not blocked) and pointed at
 * OpenRouter once the PKCE challenge is ready. Falls back to a full-page
 * redirect if popups are blocked.
 */
export function startOpenRouterLogin(): void {
	const popup = window.open("about:blank", "openrouter-login", "popup,width=520,height=720");
	const usePopup = !!popup && !popup.closed;
	void buildOpenRouterAuthUrl(window.location.origin, usePopup ? "popup" : "redirect").then((url) => {
		if (usePopup) {
			popup.location.href = url;
		} else {
			window.location.href = url;
		}
	});
}

/**
 * Exchanges the `code` from the callback URL for an API key and saves it as
 * the OpenRouter key. Returns how the login was started so the callback page
 * knows whether to close itself; throws with a user-facing message.
 */
export async function completeOpenRouterLogin(
	callbackUrl: string,
	fetchImpl: typeof fetch = fetch,
): Promise<{ mode: LoginMode }> {
	const params = new URL(callbackUrl).searchParams;
	const code = params.get("code");
	if (!code) throw new Error("OpenRouter did not return an authorization code.");

	const raw = localStorage.getItem(PENDING_KEY);
	localStorage.removeItem(PENDING_KEY);
	const pending: PendingLogin | null = raw ? JSON.parse(raw) : null;
	if (!pending || Date.now() - pending.createdAt > PENDING_MAX_AGE_MS) {
		throw new Error("This login link has expired. Start the OpenRouter login again from Settings.");
	}

	const response = await fetchImpl(KEY_EXCHANGE_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			code,
			code_verifier: pending.verifier,
			code_challenge_method: "S256",
		}),
	});
	if (!response.ok) {
		throw new Error(`OpenRouter rejected the login (HTTP ${response.status}). Please try again.`);
	}
	const { key } = (await response.json()) as { key?: string };
	if (!key) throw new Error("OpenRouter did not return an API key.");

	saveSettings({ ...getSettings(), provider: "openrouter", apiKey: key });
	return { mode: pending.mode };
}
