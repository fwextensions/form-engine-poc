"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SubmissionDataDisplay()
{
	const searchParams = useSearchParams();
	const formDataString = searchParams.get("data");

	let formData = null;
	let error = null;

	if (formDataString) {
		try {
			formData = JSON.parse(decodeURIComponent(formDataString));
		} catch (e) {
			console.error("Error parsing form data:", e);
			error = "Failed to parse submitted data. It might be malformed.";
		}
	} else {
		error = "No submission data found.";
	}

	return (
		<>
			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
					<strong className="font-bold">Error: </strong>
					<span className="block sm:inline">{error}</span>
				</div>
			)}

			{formData && (
				<div className="mb-6">
					<h2 className="text-xl font-semibold mb-3 text-gray-700">Submitted
						Data (JSON):</h2>
					<pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-sm border border-gray-200">
						{JSON.stringify(formData, null, 2)}
					</pre>
				</div>
			)}
		</>
	);
}

export default function SubmissionPage()
{
	const router = useRouter();

	const handleBack = () => router.push("/");

	return (
		<main className="flex min-h-screen flex-col items-center justify-start p-5 md:p-8 lg:p-12 bg-gray-100">
			<div className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-lg shadow-md">
				<h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Form
					Submission</h1>

				<Suspense fallback={<div className="text-center py-4">Loading submission
					data...</div>}>
					<SubmissionDataDisplay />
				</Suspense>

				<div className="mt-8 flex justify-center">
					<button
						type="button"
						onClick={handleBack}
						className="box-border text-white touch-manipulation bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-6 py-2.5 focus:outline-none"
					>
						Back to Form
					</button>
				</div>
			</div>
		</main>
	);
}
