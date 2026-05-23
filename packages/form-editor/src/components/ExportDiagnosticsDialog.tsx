"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { ExportDiagnostic } from "form-exporters";

interface ExportDiagnosticsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	diagnostics: ExportDiagnostic[];
	filename: string;
}

const severityConfig = {
	warning: {
		icon: "⚠️",
		label: "Warning",
		badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
		borderClass: "border-l-amber-400",
	},
	info: {
		icon: "ℹ️",
		label: "Info",
		badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
		borderClass: "border-l-blue-400",
	},
} as const;

export default function ExportDiagnosticsDialog({
	open,
	onOpenChange,
	diagnostics,
	filename,
}: ExportDiagnosticsDialogProps) {
	const warnings = diagnostics.filter((d) => d.severity === "warning");
	const infos = diagnostics.filter((d) => d.severity === "info");

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
				<Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-lg max-h-[80vh] flex flex-col">
					<div className="px-6 pt-5 pb-4 border-b border-gray-200">
						<Dialog.Title className="text-lg font-semibold text-gray-900">
							Export Complete
						</Dialog.Title>
						<Dialog.Description className="mt-1 text-sm text-gray-500">
							<span className="font-medium">{filename}</span> has been downloaded.
							{diagnostics.length > 0 && (
								<>
									{" "}Some features could not be fully mapped to the Fillout format.
								</>
							)}
						</Dialog.Description>
					</div>

					{diagnostics.length > 0 && (
						<div className="px-6 py-4 overflow-y-auto flex-1">
							{warnings.length > 0 && (
								<div className="mb-4">
									<h3 className="text-sm font-semibold text-gray-700 mb-2">
										{warnings.length} Warning{warnings.length !== 1 && "s"}
									</h3>
									<ul className="space-y-2">
										{warnings.map((d, i) => (
											<DiagnosticItem key={i} diagnostic={d} />
										))}
									</ul>
								</div>
							)}
							{infos.length > 0 && (
								<div>
									<h3 className="text-sm font-semibold text-gray-700 mb-2">
										{infos.length} Note{infos.length !== 1 && "s"}
									</h3>
									<ul className="space-y-2">
										{infos.map((d, i) => (
											<DiagnosticItem key={i} diagnostic={d} />
										))}
									</ul>
								</div>
							)}
						</div>
					)}

					<div className="px-6 py-4 border-t border-gray-200 flex justify-end">
						<Dialog.Close asChild>
							<button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded text-sm">
								Done
							</button>
						</Dialog.Close>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

function DiagnosticItem({ diagnostic }: { diagnostic: ExportDiagnostic }) {
	const config = severityConfig[diagnostic.severity];

	return (
		<li className={`border-l-4 ${config.borderClass} bg-gray-50 rounded-r px-3 py-2`}>
			<div className="flex items-start gap-2">
				<span className="text-sm leading-5 flex-shrink-0">{config.icon}</span>
				<div className="min-w-0">
					{diagnostic.componentId && (
						<span className={`inline-block text-xs font-mono px-1.5 py-0.5 rounded border mr-1.5 ${config.badgeClass}`}>
							{diagnostic.componentId}
						</span>
					)}
					<span className="text-sm text-gray-700">{diagnostic.message}</span>
				</div>
			</div>
		</li>
	);
}
