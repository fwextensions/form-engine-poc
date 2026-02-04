"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { getSettings, saveSettings, type LLMProvider } from "@/lib/settings";

interface SettingsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Settings dialog for configuring LLM provider and API key.
 * Uses Radix UI Dialog for the modal interface.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */
export default function SettingsDialog({
	open,
	onOpenChange,
}: SettingsDialogProps) {
	const [provider, setProvider] = useState<LLMProvider>("anthropic");
	const [apiKey, setApiKey] = useState("");
	const [model, setModel] = useState("");

	// Load settings when dialog opens
	useEffect(() => {
		if (open) {
			const settings = getSettings();
			setProvider(settings.provider);
			setApiKey(settings.apiKey || "");
			setModel(settings.model || "");
		}
	}, [open]);

	const handleSave = () => {
		try {
			saveSettings({
				provider,
				apiKey: apiKey.trim() || undefined,
				model: model.trim() || undefined,
			});
			onOpenChange(false);
		} catch (error) {
			alert(
				error instanceof Error
					? error.message
					: "Failed to save settings",
			);
		}
	};

	const handleCancel = () => {
		onOpenChange(false);
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
				<Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-full max-w-md z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
					<Dialog.Title className="text-xl font-semibold mb-4">
						LLM Settings
					</Dialog.Title>
					<Dialog.Description className="text-sm text-slate-600 mb-6">
						Configure your LLM provider and API key for AI-assisted
						form generation.
					</Dialog.Description>

					<div className="space-y-4">
						{/* Provider Selection */}
						<div>
							<label
								htmlFor="provider"
								className="block text-sm font-medium text-slate-700 mb-1"
							>
								Provider
							</label>
							<select
								id="provider"
								value={provider}
								onChange={(e) =>
									setProvider(e.target.value as LLMProvider)
								}
								className="w-full bg-white border border-slate-300 rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="anthropic">Anthropic (Claude)</option>
								<option value="openai">OpenAI (GPT)</option>
							</select>
						</div>

						{/* API Key Input */}
						<div>
							<label
								htmlFor="apiKey"
								className="block text-sm font-medium text-slate-700 mb-1"
							>
								API Key
							</label>
							<input
								id="apiKey"
								type="password"
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								placeholder="Enter your API key"
								className="w-full bg-white border border-slate-300 rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							<p className="text-xs text-slate-500 mt-1">
								Your API key is stored locally in your browser.
							</p>
						</div>

						{/* Model Input (Optional) */}
						<div>
							<label
								htmlFor="model"
								className="block text-sm font-medium text-slate-700 mb-1"
							>
								Model (Optional)
							</label>
							<input
								id="model"
								type="text"
								value={model}
								onChange={(e) => setModel(e.target.value)}
								placeholder={
									provider === "anthropic"
										? "e.g., claude-haiku-4-5-20251001"
										: "e.g., gpt-4"
								}
								className="w-full bg-white border border-slate-300 rounded py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
							<p className="text-xs text-slate-500 mt-1">
								Leave empty to use the default model.
							</p>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex justify-end gap-2 mt-6">
						<button
							onClick={handleCancel}
							className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-4 rounded text-sm transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm transition-colors"
						>
							Save
						</button>
					</div>

					<Dialog.Close asChild>
						<button
							className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
							aria-label="Close"
						>
							<svg
								width="15"
								height="15"
								viewBox="0 0 15 15"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
									fill="currentColor"
									fillRule="evenodd"
									clipRule="evenodd"
								/>
							</svg>
						</button>
					</Dialog.Close>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
