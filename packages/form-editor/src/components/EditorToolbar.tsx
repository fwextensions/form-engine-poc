import React from "react";

interface EditorToolbarProps {
	forms: string[];
	selectedForm: string;
	onNewForm: () => void;
	onSelectForm: (name: string) => void;
}

const EditorToolbar = ({
	forms,
	selectedForm,
	onNewForm,
	onSelectForm,
}: EditorToolbarProps) => {
	return (
		<div className="bg-slate-100 border-b border-slate-300 p-2 flex items-center gap-4 w-full">
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
			</div>
		</div>
	);
};

export default EditorToolbar;
