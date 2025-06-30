import React from "react";

interface EditorToolbarProps {
	forms: string[];
	selectedForm: string;
	onNewForm: () => void;
	onSelectForm: (name: string) => void;
	onDeleteForm: () => void;
	currentPage: number;
	totalPages: number;
	pageTitle: string;
	onPrevPage: () => void;
	onNextPage: () => void;
}

const EditorToolbar = ({
	forms,
	selectedForm,
	onNewForm,
	onSelectForm,
	onDeleteForm,
	currentPage,
	totalPages,
	pageTitle,
	onPrevPage,
	onNextPage,
}: EditorToolbarProps) => {
	return (
		<div className="bg-slate-100 border-b border-slate-300 p-2 flex items-center justify-between w-full">
			<div className="flex items-center gap-2">
				<select
					value={selectedForm}
					onChange={(e) => onSelectForm(e.target.value)}
					className="bg-white border border-slate-300 rounded py-1 px-2 text-sm"
				>
					{forms.map((formName) => (
						<option key={formName} value={formName}>
							{formName}
						</option>
					))}
				</select>
				<button
					onClick={onNewForm}
					className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
				>
					New
				</button>
				<button
					onClick={onDeleteForm}
					className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
				>
					Delete
				</button>
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
