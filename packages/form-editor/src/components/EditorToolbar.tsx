import React from "react";
import * as Toolbar from "@radix-ui/react-toolbar";
import ToolbarIconButton from "./ToolbarIconButton";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

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
			</Toolbar.Root>
		</div>
	);
};

export default EditorToolbar;
