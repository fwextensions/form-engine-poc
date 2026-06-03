import React from "react";
import * as Toolbar from "@radix-ui/react-toolbar";
import ToolbarIconButton from "./ToolbarIconButton";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

interface PreviewToolbarProps {
	currentPage: number;
	totalPages: number;
	pageTitle: string;
	onPrevPage: () => void;
	onNextPage: () => void;
	onExportFillout?: () => void;
}

const PreviewToolbar = ({
	currentPage,
	totalPages,
	pageTitle,
	onPrevPage,
	onNextPage,
	onExportFillout,
}: PreviewToolbarProps) => {
	return (
		<Toolbar.Root className="bg-slate-50 border-b border-slate-200 min-h-12 px-2 flex items-center gap-0 shrink-0" aria-label="Preview toolbar">
			<ToolbarIconButton
				onClick={onPrevPage}
				disabled={currentPage === 0 || totalPages <= 1}
				title="Previous page"
			>
				<ChevronLeftIcon />
			</ToolbarIconButton>
			<ToolbarIconButton
				onClick={onNextPage}
				disabled={currentPage >= totalPages - 1 || totalPages <= 1}
				title="Next page"
			>
				<ChevronRightIcon />
			</ToolbarIconButton>
			<span className="mx-1 text-sm text-slate-600 font-semibold flex-1 truncate">
				{pageTitle} ({currentPage + 1} / {totalPages})
			</span>
			{onExportFillout && (
				<Toolbar.Button
					onClick={onExportFillout}
					className="ml-auto mr-2 bg-[#F6C744] hover:bg-[#FED645] font-bold py-1 px-3 rounded text-sm shrink-0"
					title="Export current form as Fillout JSON"
				>
					Export to Fillout
				</Toolbar.Button>
			)}
		</Toolbar.Root>
	);
};

export default PreviewToolbar;
