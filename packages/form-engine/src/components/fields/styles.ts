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

// Single-line class strings used by field controls. Keep each on one line so
// Tailwind's source scanner picks every class up.
export const inputClassName = "mt-1.5 block w-full px-3 py-2 border border-ink-100 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";
export const fileInputClassName = "mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500";
export const optionLabelClassName = "block text-sm text-ink-700";
export const checkboxClassName = "flex h-5 w-5 items-center justify-center rounded border border-ink-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600 data-[state=checked]:text-white disabled:bg-gray-100 disabled:cursor-not-allowed";
export const radioItemClassName = "h-4 w-4 rounded-full border border-ink-200 text-primary-600 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600";
