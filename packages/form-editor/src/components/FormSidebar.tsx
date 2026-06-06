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
		<div className="flex flex-col h-full w-48 shrink-0 bg-ink-50 border-r border-ink-100">
			{/* Header — height matches the tab bar in EditorPane (py-3 + text-sm) */}
			<div className="flex items-center justify-between min-h-12 pl-4 pr-3 border-b border-ink-100 bg-ink-50">
				<span className="font-slab text-[15px] font-semibold text-ink-800">Forms</span>
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
				className="flex-1 overflow-y-auto py-1 outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
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
							"mx-2 px-2.5 py-1.5 text-sm rounded-md cursor-pointer truncate select-none",
							formName === selectedForm
								? "bg-primary-600 text-white font-semibold"
								: "text-ink-700 hover:bg-ink-100",
						].join(" ")}
					>
						{formName}
					</li>
				))}
			</ul>

			{/* Footer — settings */}
			<div className="border-t border-ink-100 p-2">
				<button
					onClick={onOpenSettings}
					className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-ink-600 rounded hover:bg-ink-100 transition-colors"
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
