interface StreamingIndicatorProps {
	label?: string;
	hasContent?: boolean;
}

export function StreamingIndicator({ label, hasContent }: StreamingIndicatorProps) {
	return (
		<div className={`flex items-center gap-2 text-slate-500 ${hasContent ? 'pt-2' : ''}`}>
			<span
				className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
				style={{ animationDelay: '0ms' }}
			/>
			<span
				className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
				style={{ animationDelay: '150ms' }}
			/>
			<span
				className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
				style={{ animationDelay: '300ms' }}
			/>
			{label && <span className="text-sm ml-1">{label}</span>}
		</div>
	);
}
