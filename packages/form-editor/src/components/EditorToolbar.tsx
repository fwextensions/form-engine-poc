import React from "react";
import * as Toolbar from "@radix-ui/react-toolbar";

interface EditorToolbarProps {
	currentPage: number;
	totalPages: number;
	pageTitle: string;
	onPrevPage: () => void;
	onNextPage: () => void;
	onOpenSettings: () => void;
	/** Export the current form to an external format. */
	onExportFillout?: () => void;
}

const EditorToolbar = ({
	currentPage,
	totalPages,
	pageTitle,
	onPrevPage,
	onNextPage,
	onOpenSettings,
	onExportFillout,
}: EditorToolbarProps) => {
	return (
		<div className="bg-slate-100 border-b border-slate-300 p-2 flex items-center justify-between w-full">
			<Toolbar.Root className="flex items-center gap-2" aria-label="Editor actions">
				<Toolbar.Button
					onClick={onOpenSettings}
					className="bg-slate-500 hover:bg-slate-700 text-white font-bold py-1 px-3 rounded text-sm"
					title="Settings"
				>
					Settings
				</Toolbar.Button>
				{onExportFillout && (
					<>
						<Toolbar.Separator className="w-px h-6 bg-slate-300 mx-1" />
						<Toolbar.Button
							onClick={onExportFillout}
							className="bg-[#F6C744] hover:bg-[#FED645] font-bold py-1 px-3 rounded text-sm"
							title="Export current form as Fillout JSON"
						>
							Export to Fillout
						</Toolbar.Button>
					</>
				)}
			</Toolbar.Root>

			<Toolbar.Root className="flex items-center gap-0" aria-label="Preview page navigation">
				<span className="mr-2 text-sm text-slate-600 font-semibold">
					{pageTitle} ({currentPage + 1} / {totalPages})
				</span>
				<Toolbar.Button
					onClick={onPrevPage}
					disabled={currentPage === 0 || totalPages <= 1}
					className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-600 transition-colors enabled:hover:bg-slate-200 enabled:hover:text-blue-600 enabled:active:bg-slate-300 enabled:active:text-blue-700 disabled:opacity-30"
					title="Previous page"
					aria-label="Previous page"
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="h-4 w-4"
						aria-hidden="true"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
				</Toolbar.Button>
				<Toolbar.Button
					onClick={onNextPage}
					disabled={currentPage >= totalPages - 1 || totalPages <= 1}
					className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-600 transition-colors enabled:hover:bg-slate-200 enabled:hover:text-blue-600 enabled:active:bg-slate-300 enabled:active:text-blue-700 disabled:opacity-30"
					title="Next page"
					aria-label="Next page"
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="h-4 w-4"
						aria-hidden="true"
					>
						<path d="m9 18 6-6-6-6" />
					</svg>
				</Toolbar.Button>
			</Toolbar.Root>
		</div>
	);
};

export default EditorToolbar;
