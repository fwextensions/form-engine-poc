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
		<div className="bg-slate-100 border-b border-slate-200 px-2 py-1 flex items-center justify-between shrink-0">
			<Toolbar.Root className="flex items-center gap-0" aria-label="Preview page navigation">
				<ToolbarIconButton
					onClick={onPrevPage}
					disabled={currentPage === 0 || totalPages <= 1}
					title="Previous page"
				>
					<ChevronLeftIcon />
				</ToolbarIconButton>
				<span className="mx-1 text-sm text-slate-600 font-semibold">
					{pageTitle} ({currentPage + 1} / {totalPages})
				</span>
				<ToolbarIconButton
					onClick={onNextPage}
					disabled={currentPage >= totalPages - 1 || totalPages <= 1}
					title="Next page"
				>
					<ChevronRightIcon />
				</ToolbarIconButton>
			</Toolbar.Root>
			{onExportFillout && (
				<Toolbar.Root className="flex items-center" aria-label="Export actions">
					<Toolbar.Button
						onClick={onExportFillout}
						className="bg-[#F6C744] hover:bg-[#FED645] font-bold py-1 px-3 rounded text-sm"
						title="Export current form as Fillout JSON"
					>
						Export to Fillout
					</Toolbar.Button>
				</Toolbar.Root>
			)}
		</div>
	);
};

export default PreviewToolbar;
