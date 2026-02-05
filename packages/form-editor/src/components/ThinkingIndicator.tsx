/**
 * ThinkingIndicator component
 * 
 * Displays an animated indicator when the LLM is processing a request.
 * Shows animated dots with "Thinking..." text to provide visual feedback
 * that the system is working.
 * 
 * Requirements: 2.1, 2.3
 */
export function ThinkingIndicator() {
	return (
		<div className="flex justify-start mb-4">
			<div className="max-w-[80%] rounded-lg px-4 py-3 bg-slate-100">
				<div className="flex items-center gap-2 text-slate-500">
					{/* Animated dots */}
					<div className="flex gap-1">
						<div 
							className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"
							style={{ animationDelay: '0s' }}
						/>
						<div 
							className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"
							style={{ animationDelay: '0.2s' }}
						/>
						<div 
							className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"
							style={{ animationDelay: '0.4s' }}
						/>
					</div>
					{/* Thinking text */}
					<span className="text-sm">Thinking...</span>
				</div>
			</div>
		</div>
	);
}
