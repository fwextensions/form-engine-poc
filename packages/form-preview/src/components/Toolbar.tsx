import React from "react";

interface ToolbarProps {
	currentPage: number;
	totalPages: number;
	onPrevPage: () => void;
	onNextPage: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ currentPage, totalPages, onPrevPage, onNextPage }) => {
	return (
		<div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
			<span>
				Page {currentPage + 1} of {totalPages}
			</span>
			<div className="flex items-center space-x-2">
				<button
					disabled={currentPage <= 0}
					onClick={onPrevPage}
					className="px-3 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md enabled:hover:bg-slate-200 enabled:dark:hover:bg-slate-600 disabled:opacity-50"
				>
					◀
				</button>
				<button
					disabled={currentPage >= totalPages - 1}
					onClick={onNextPage}
					className="px-3 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md enabled:hover:bg-slate-200 enabled:dark:hover:bg-slate-600 disabled:opacity-50"
				>
					▶
				</button>
			</div>
		</div>
	);
};

export default Toolbar;
