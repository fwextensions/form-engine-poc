// Common form field styles
export const inputStyles = `
	w-full px-3 py-2
	bg-white border border-ink-100 rounded
	text-ink-800 placeholder-ink-400
	focus:outline-none focus:ring-1 focus:ring-primary-600 focus:border-primary-600
	disabled:bg-ink-50 disabled:text-ink-400 disabled:cursor-not-allowed
	transition-colors duration-200
`;

// Label styles
export const labelStyles = `
	block text-sm font-semibold text-ink-700 mb-1.5
`;

// Form message styles
export const messageStyles = `
	text-sm text-danger-500 mt-1.5
`;

// Common spacing and layout
export const fieldSpacing = "mb-5"; // Increased spacing between fields
export const fieldContainer = "grid gap-1.5"; // Adjusted gap within field container

// Common focus styles
export const focusRing = "focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2";

// Common transitions
export const transition = "transition-all duration-200";

// Common border radius
export const borderRadius = "rounded";
