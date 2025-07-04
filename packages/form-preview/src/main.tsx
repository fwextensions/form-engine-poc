import React, { useState, useRef } from "react";
import ReactDOM from "react-dom/client";
import schema from "../schema.yaml";
import {
	FormEngine,
	type FormEngineHandle,
	type FormMeta,
} from "form-engine";
import Toolbar from "./components/Toolbar";
import "./index.css";

const App: React.FC = () => {
	const [currentPage, setCurrentPage] = useState<number>(0);
	const [formMeta, setFormMeta] = useState<FormMeta | null>(null);
	const formRef = useRef<FormEngineHandle>(null);

	const handlePrevPage = () => formRef.current?.goToPage(currentPage - 1);
	const handleNextPage = () => formRef.current?.goToPage(currentPage + 1);

	const totalPages = formMeta?.pageCount ?? 0;

	return (
		<main className="max-w-5xl mx-auto my-8 bg-white dark:bg-slate-800 rounded-lg shadow">
			<Toolbar
				currentPage={currentPage}
				totalPages={totalPages}
				onPrevPage={handlePrevPage}
				onNextPage={handleNextPage}
			/>
			<div className="p-8">
				<FormEngine
					ref={formRef}
					schema={schema}
					displayMode="multipage"
					currentPage={currentPage}
					onPageChange={setCurrentPage}
					onMetaChange={setFormMeta}
				/>
			</div>
		</main>
	);
};

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement
);

root.render(<App />);
