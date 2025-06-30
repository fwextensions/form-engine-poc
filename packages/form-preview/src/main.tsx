import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import schema from "../schema.yaml";
import { FormEngine } from "form-engine";
import Toolbar from "./components/Toolbar";
import "./index.css";

const App: React.FC = () => {
	const [currentPage, setCurrentPage] = useState<number>(0);
	const totalPages = Array.isArray(schema.children)
		? schema.children.filter((c) => c.type === "page").length
		: 1;

	return (
		<main className="max-w-5xl mx-auto my-8 bg-white dark:bg-slate-800 rounded-lg shadow">
			<Toolbar
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={setCurrentPage}
			/>
			<div className="p-8">
				<FormEngine
					schema={schema}
					displayMode="multipage"
					currentPage={currentPage}
					onPageChange={setCurrentPage}
				/>
			</div>
		</main>
	);
};

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement
);

root.render(<App />);
