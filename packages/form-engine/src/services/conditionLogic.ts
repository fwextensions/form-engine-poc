// packages/form-engine/src/services/conditionLogic.ts
import jsonLogic from "json-logic-js";

export function evaluateCondition(
	condition: any,
	formData: Record<string, any>,
	formContext?: Record<string, any>
): boolean {
	if (condition === undefined || condition === null) {
		return true; // No condition means always render
	}
	try {
		// Ensure context is an object, even if undefined in parameters
		const dataForLogic = {
			formData: formData || {},
			context: formContext || {},
			// Potentially add other data sources for JSONLogic if needed
		};
		return jsonLogic.apply(condition, dataForLogic);
	} catch (error) {
		console.error("Error evaluating condition:", error, "\nCondition:", JSON.stringify(condition), "\nData:", JSON.stringify(dataForLogic));
		return false; // Default to not rendering if condition evaluation fails
	}
}
