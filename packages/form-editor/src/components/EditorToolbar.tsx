import React from "react";

interface EditorToolbarProps {
	currentPage: number;
	totalPages: number;
	pageTitle: string;
	onPrevPage: () => void;
	onNextPage: () => void;
	onOpenSettings: () => void;
	/** Undo/redo props — shown when provided */
	history?: {
		canUndo: boolean;
		canRedo: boolean;
		undoDescription?: string;
		redoDescription?: string;
		onUndo: () => void;
		onRedo: () => void;
	};
}

const EditorToolbar = ({
	currentPage,
	totalPages,
	pageTitle,
	onPrevPage,
	onNextPage,
	onOpenSettings,
	history,
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
				{history && (
					<>
						<div className="w-px h-6 bg-slate-300 mx-1" />
						<button
							onClick={history.onUndo}
							disabled={!history.canUndo}
							className="bg-slate-200 enabled:hover:bg-slate-300 border border-slate-400 rounded px-3 py-1 text-sm font-bold disabled:opacity-50"
							title={history.undoDescription ? `Undo: ${history.undoDescription}` : "Undo"}
						>
							Undo
						</button>
						<button
							onClick={history.onRedo}
							disabled={!history.canRedo}
							className="bg-slate-200 enabled:hover:bg-slate-300 border border-slate-400 rounded px-3 py-1 text-sm font-bold disabled:opacity-50"
							title={history.redoDescription ? `Redo: ${history.redoDescription}` : "Redo"}
						>
							Redo
						</button>
					</>
				)}
			</div>

			<div className="flex items-center gap-2">
				<span className="text-sm font-semibold">
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
