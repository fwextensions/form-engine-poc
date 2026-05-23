import React from "react";

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
			<div className="flex items-center gap-2">
				<button
					onClick={onOpenSettings}
					className="bg-slate-500 hover:bg-slate-700 text-white font-bold py-1 px-3 rounded text-sm"
					title="Settings"
				>
					Settings
				</button>
				{onExportFillout && (
					<>
						<div className="w-px h-6 bg-slate-300 mx-1" />
						<button
							onClick={onExportFillout}
							className="bg-[#F6C744] hover:bg-[#FED645] font-bold py-1 px-3 rounded text-sm"
							title="Export current form as Fillout JSON"
						>
							Export to Fillout
						</button>
					</>
				)}
			</div>

			<div className="flex items-center gap-2">
				<span className="text-sm text-slate-600 font-semibold">
					{pageTitle} ({currentPage + 1} / {totalPages})
				</span>
				<button
					onClick={onPrevPage}
					disabled={currentPage === 0 || totalPages <= 1}
					className="bg-slate-200 enabled:hover:bg-slate-300 border border-slate-400 rounded px-3 py-1 text-sm font-bold disabled:opacity-50"
				>
					&#9664;
				</button>
				<button
					onClick={onNextPage}
					disabled={currentPage >= totalPages - 1 || totalPages <= 1}
					className="bg-slate-200 enabled:hover:bg-slate-300 border border-slate-400 rounded px-3 py-1 text-sm font-bold disabled:opacity-50"
				>
					&#9654;
				</button>
			</div>
		</div>
	);
};

export default EditorToolbar;
