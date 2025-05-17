// Common form field styles
export const inputStyles = `
  w-full px-3 py-2
  bg-white border border-gray-300 rounded-md
  shadow-sm
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
  disabled:bg-gray-100 disabled:text-gray-500
  transition-colors duration-200
  text-gray-900 placeholder-gray-400
`;

// Label styles
export const labelStyles = `
  block text-sm font-medium text-gray-700
  mb-1
`;

// Form message styles
export const formMessageStyles = `
  text-sm text-red-600
  mt-1
`;

// Common spacing and layout
export const fieldSpacing = "mb-4";
export const fieldContainer = "grid gap-1";

// Common focus styles
export const focusRing = "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

// Common transitions
export const transition = "transition-all duration-200";

// Common border radius
export const borderRadius = "rounded-md";

// Field container styles (legacy, consider using fieldSpacing and fieldContainer instead)
export const fieldContainerStyles = `${fieldSpacing} ${fieldContainer}`;

// Checkbox and radio specific styles
export const checkboxRootStyles = "shadow-sm flex h-[20px] w-[20px] appearance-none items-center justify-center rounded-[4px] bg-gray-100 border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white";
export const radioRootStyles = "bg-gray-100 w-[20px] h-[20px] rounded-full shadow-sm border border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 outline-none cursor-default data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600";
export const radioIndicatorStyles = "flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-[10px] after:h-[10px] after:rounded-[50%] after:bg-white";

// Select specific styles
export const selectTriggerStyles = "justify-between data-[placeholder]:text-gray-500";
export const selectContentStyles = "z-50 w-[--radix-select-trigger-width] bg-white rounded-md shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]";
export const selectScrollButtonStyles = "flex items-center justify-center h-[25px] bg-white text-gray-700 cursor-default";
export const selectViewportStyles = "p-[5px]";
export const selectItemStyles = "text-[13px] leading-none text-gray-900 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-gray-400 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-blue-500 data-[highlighted]:text-white";
export const selectItemIndicatorStyles = "absolute left-0 w-[25px] inline-flex items-center justify-center";

// Textarea specific styles
export const textareaStyles = "h-auto min-h-[70px] py-2 leading-normal";

// Checkbox and radio label styles
export const optionLabelStyles = "text-gray-700 text-[15px] leading-none pl-[10px] select-none";
