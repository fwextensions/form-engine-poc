import React, { useRef, useEffect } from "react";
import * as Toolbar from "@radix-ui/react-toolbar";
import ToolbarIconButton from "./ToolbarIconButton";
import { PlusIcon, TrashIcon, GearIcon } from "./icons";

interface FormSidebarProps {
	forms: string[];
	selectedForm: string;
	onSelectForm: (name: string) => void;
	onNewForm: () => void;
	onDeleteForm: () => void;
	onOpenSettings: () => void;
}

const FormSidebar = ({
	forms,
	selectedForm,
	onSelectForm,
	onNewForm,
	onDeleteForm,
	onOpenSettings,
}: FormSidebarProps) => {
	const listRef = useRef<HTMLUListElement>(null);
	const selectedIndex = forms.indexOf(selectedForm);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			const next = Math.min(selectedIndex + 1, forms.length - 1);
			if (next !== selectedIndex) onSelectForm(forms[next]);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			const prev = Math.max(selectedIndex - 1, 0);
			if (prev !== selectedIndex) onSelectForm(forms[prev]);
		}
	};

	// Keep the selected item scrolled into view
	useEffect(() => {
		if (!listRef.current) return;
		const item = listRef.current.children[selectedIndex] as HTMLElement | undefined;
		item?.scrollIntoView({ block: "nearest" });
	}, [selectedIndex]);

	return (
		<div className="flex flex-col h-full w-48 shrink-0 bg-slate-100 border-r border-slate-200">
			{/* Header — height matches the tab bar in EditorPane (py-3 + text-sm) */}
			<div className="flex items-center justify-between px-3 py-[7px] border-b border-slate-200 bg-slate-50">
				<span className="text-sm font-semibold text-slate-600 tracking-wide">Forms</span>
				<Toolbar.Root className="flex items-center gap-0" aria-label="Form actions">
					<ToolbarIconButton
						onClick={onNewForm}
						title="New form"
					>
						<PlusIcon />
					</ToolbarIconButton>
					<ToolbarIconButton
						onClick={onDeleteForm}
						disabled={!selectedForm}
						title="Delete selected form"
						variant="red"
					>
						<TrashIcon />
					</ToolbarIconButton>
				</Toolbar.Root>
			</div>

			{/* Form list */}
			<ul
				ref={listRef}
				tabIndex={0}
				onKeyDown={handleKeyDown}
				className="flex-1 overflow-y-auto py-1 outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400"
				role="listbox"
				aria-label="Forms"
			>
				{forms.map((formName) => (
					<li
						key={formName}
						role="option"
						aria-selected={formName === selectedForm}
						onClick={() => onSelectForm(formName)}
						title={formName}
						className={[
							"px-3 py-1.5 text-sm cursor-pointer truncate select-none",
							formName === selectedForm
								? "bg-blue-500 text-white"
								: "text-slate-700 hover:bg-slate-200",
						].join(" ")}
					>
						{formName}
					</li>
				))}
			</ul>

			{/* Footer — settings */}
			<div className="border-t border-slate-200 p-2">
				<button
					onClick={onOpenSettings}
					className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-slate-600 rounded hover:bg-slate-200 transition-colors"
					title="Settings"
				>
					<GearIcon />
					Settings
				</button>
			</div>
		</div>
	);
};

export default FormSidebar;
