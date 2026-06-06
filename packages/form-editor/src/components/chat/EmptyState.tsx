"use client";

import { ThreadPrimitive } from "@assistant-ui/react";

const examplePrompts = [
	"Create a contact form with name, email, and message fields",
	"Build a multi-step registration form with personal info and preferences",
	"Design a survey form with rating scales and text feedback",
];

interface EmptyStateProps {
	isClient: boolean;
	hasKey: boolean;
	onOpenSettings: () => void;
}

export function EmptyState({ isClient, hasKey, onOpenSettings }: EmptyStateProps) {
	if (!isClient) {
		return (
			<div className="flex flex-col h-full bg-white">
				<div className="flex-1 flex items-center justify-center">
					<div className="text-slate-400">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-white">
			<div className="flex-1 flex flex-col items-center justify-center p-8">
				{!hasKey ? (
					<div className="text-center max-w-md">
						<div className="mb-4">
							<svg
								className="w-16 h-16 mx-auto text-slate-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
						</div>
						<h3 className="text-xl font-semibold text-slate-800 mb-2">
							API Key Required
						</h3>
						<p className="text-slate-600 mb-6">
							To use the AI assistant, you need to configure your LLM
							API key in settings.
						</p>
						<button
							onClick={onOpenSettings}
							className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition-colors"
						>
							Open Settings
						</button>
					</div>
				) : (
					<div className="text-center max-w-2xl">
						<div className="mb-6">
							<svg
								className="w-16 h-16 mx-auto text-primary-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
								/>
							</svg>
						</div>
						<h3 className="text-xl font-slab font-semibold text-slate-800 mb-2">
							Create a form
						</h3>
						<p className="text-slate-600 mb-6">
							Describe the form you want to create, and I&apos;ll generate
							the YAML schema for you. Or drop a PDF file to extract the form questions.
						</p>

						<div className="space-y-3">
							<p className="text-sm font-medium text-slate-700 mb-3">
								Try these examples:
							</p>
							{examplePrompts.map((prompt, index) => (
								<ThreadPrimitive.Suggestion
									key={index}
									prompt={prompt}
									method="replace"
									autoSend
									className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
								>
									<p className="text-sm text-slate-700">{prompt}</p>
								</ThreadPrimitive.Suggestion>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
