/**
 * Chat Storage — Per-form conversation persistence in localStorage
 *
 * Stores chat messages for each form so conversations are preserved
 * when switching between forms and across page reloads.
 */

import type { UIMessage } from "ai";
import type { SerializedHistory } from "@/lib/jsonl";

const CHAT_STORAGE_PREFIX = "form-editor-chat-";
const HISTORY_STORAGE_PREFIX = "form-editor-history-";

function getChatKey(formName: string): string {
	return `${CHAT_STORAGE_PREFIX}${formName}`;
}

/**
 * Serializable subset of UIMessage for storage.
 * We only persist text parts since tool calls, images, etc.
 * are not restorable across sessions.
 */
interface StoredMessage {
	id: string;
	role: "user" | "assistant" | "system";
	parts: Array<{ type: "text"; text: string }>;
}

/**
 * Save chat messages for a form to localStorage.
 */
export function saveChatMessages(
	formName: string,
	messages: UIMessage[],
): void {
	if (typeof window === "undefined") return;

	const stored: StoredMessage[] = messages.map((msg) => ({
		id: msg.id,
		role: msg.role,
		parts: msg.parts
			.filter(
				(part): part is { type: "text"; text: string } => part.type === "text",
			)
			.map((part) => ({ type: "text" as const, text: part.text })),
	}));

	try {
		localStorage.setItem(getChatKey(formName), JSON.stringify(stored));
	} catch {
		// localStorage might be full — silently fail
	}
}

/**
 * Load chat messages for a form from localStorage.
 * Returns an empty array if none found.
 */
export function loadChatMessages(formName: string): UIMessage[] {
	if (typeof window === "undefined") return [];

	try {
		const raw = localStorage.getItem(getChatKey(formName));
		if (!raw) return [];

		const stored: StoredMessage[] = JSON.parse(raw);

		return stored.map((msg) => ({
			id: msg.id,
			role: msg.role,
			parts: msg.parts,
		}));
	} catch {
		return [];
	}
}

/**
 * Delete chat messages for a form from localStorage.
 */
export function deleteChatMessages(formName: string): void {
	if (typeof window === "undefined") return;

	localStorage.removeItem(getChatKey(formName));
}

// --- History persistence ---

function getHistoryKey(formName: string): string {
	return `${HISTORY_STORAGE_PREFIX}${formName}`;
}

/**
 * Save undo/redo history for a form to localStorage.
 */
export function saveHistory(
	formName: string,
	history: SerializedHistory,
): void {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(getHistoryKey(formName), JSON.stringify(history));
	} catch {
		// localStorage might be full — silently fail
	}
}

/**
 * Load undo/redo history for a form from localStorage.
 * Returns null if none found.
 */
export function loadHistory(formName: string): SerializedHistory | null {
	if (typeof window === "undefined") return null;

	try {
		const raw = localStorage.getItem(getHistoryKey(formName));
		if (!raw) return null;

		return JSON.parse(raw) as SerializedHistory;
	} catch {
		return null;
	}
}

/**
 * Delete undo/redo history for a form from localStorage.
 */
export function deleteHistory(formName: string): void {
	if (typeof window === "undefined") return;

	localStorage.removeItem(getHistoryKey(formName));
}
