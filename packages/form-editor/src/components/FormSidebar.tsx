import React, { useRef, useEffect } from "react";
import * as Toolbar from "@radix-ui/react-toolbar";

interface FormSidebarProps {
	forms: string[];
	selectedForm: string;
	onSelectForm: (name: string) => void;
	onNewForm: () => void;
	onDeleteForm: () => void;
}

const FormSidebar = ({
	forms,
	selectedForm,
	onSelectForm,
	onNewForm,
	onDeleteForm,
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
					<Toolbar.Button
						onClick={onNewForm}
						title="New form"
						className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-600 transition-colors hover:bg-slate-200 hover:text-blue-600"
						aria-label="New form"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<line x1="12" y1="5" x2="12" y2="19" />
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
					</Toolbar.Button>
					<Toolbar.Button
						onClick={onDeleteForm}
						disabled={!selectedForm}
						title="Delete selected form"
						className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-600 transition-colors enabled:hover:bg-slate-200 enabled:hover:text-red-600 disabled:opacity-30"
						aria-label="Delete selected form"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<polyline points="3 6 5 6 21 6" />
							<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
							<path d="M10 11v6" />
							<path d="M14 11v6" />
							<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
						</svg>
					</Toolbar.Button>
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
		</div>
	);
};

export default FormSidebar;
