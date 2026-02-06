interface ValidationFeedbackProps {
	errors?: string[];
	warnings?: string[];
}

export function ValidationFeedback({ errors, warnings }: ValidationFeedbackProps) {
	return (
		<>
			{errors && errors.length > 0 && (
				<div className="mx-4 my-2 p-3 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-sm font-medium text-red-800 mb-2">
						Validation Errors:
					</p>
					<ul className="text-sm text-red-700 space-y-1">
						{errors.map((error, idx) => (
							<li key={idx}>• {error}</li>
						))}
					</ul>
				</div>
			)}
			{warnings && warnings.length > 0 && (
				<div className="mx-4 my-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
					<p className="text-sm font-medium text-yellow-800 mb-2">
						Warnings:
					</p>
					<ul className="text-sm text-yellow-700 space-y-1">
						{warnings.map((warning, idx) => (
							<li key={idx}>• {warning}</li>
						))}
					</ul>
				</div>
			)}
		</>
	);
}
