"use client";

import { useEffect, useRef, useState } from "react";
import { completeOpenRouterLogin } from "@/lib/openrouter-auth";

/**
 * OAuth callback for "Connect OpenRouter". Exchanges the code for a key,
 * saves it, then closes the popup (or returns to the editor if the login ran
 * in the main window because popups were blocked).
 */
export default function OpenRouterCallbackPage() {
	const [status, setStatus] = useState<"working" | "done" | "error">("working");
	const [message, setMessage] = useState("Connecting your OpenRouter account…");
	const started = useRef(false);

	useEffect(() => {
		// React strict mode runs effects twice; the code can only be exchanged once.
		if (started.current) return;
		started.current = true;

		completeOpenRouterLogin(window.location.href)
			.then(({ mode }) => {
				setStatus("done");
				if (mode === "redirect") {
					setMessage("OpenRouter connected. Returning to the editor…");
					window.location.replace("/");
				} else {
					// The editor picks the key up from storage. Browsers may refuse
					// to close the popup, so the message covers that case.
					setMessage("OpenRouter connected. You can close this window.");
					window.close();
				}
			})
			.catch((error: unknown) => {
				setStatus("error");
				setMessage(error instanceof Error ? error.message : "OpenRouter login failed.");
			});
	}, []);

	return (
		<main className="min-h-screen flex items-center justify-center p-6">
			<div className="max-w-sm text-center space-y-3">
				<h1 className="text-lg font-semibold">OpenRouter</h1>
				<p
					role={status === "error" ? "alert" : "status"}
					className={status === "error" ? "text-red-700 text-sm" : "text-slate-600 text-sm"}
				>
					{message}
				</p>
				{status !== "working" && (
					<a href="/" className="text-blue-600 hover:underline text-sm">
						Back to the editor
					</a>
				)}
			</div>
		</main>
	);
}
