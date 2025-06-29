// packages/form-engine/src/hooks/useFormRules.ts
import { useMemo } from "react";
import type { FormConfig as FormSchema } from "../components/layout/Form";

/**
 * Represents a generic component configuration within the form schema.
 * It includes properties needed for rule evaluation (`id`, `rules`) and
 * for traversing the component tree (`children`).
 */
interface FormComponentConfig {
	id?: string;
	rules?: {
		when: { field: string; is: any };
		then: ({ set: Record<string, any> } | { log: string[] })[];
	}[];
	children?: FormComponentConfig[];
	[key: string]: any; // Allow other properties from the schema
}

/**
 * A map where keys are component IDs and values are objects of props to be merged.
 */
type DynamicPropsMap = Record<string, Record<string, any>>;

/**
 * Recursively traverses the component tree and collects all components into a flat array.
 * @param components - The array of components to traverse.
 * @returns A flat array of all components.
 */
function flattenComponents(components: FormComponentConfig[]): FormComponentConfig[] {
	const allComponents: FormComponentConfig[] = [];

	function traverse(comps: FormComponentConfig[])
	{
		for (const component of comps) {
			// ignore nullish values, which can happen when there are parse errors in the
			// schema.  possibly we'd want to throw or log an error here during runtime.
			if (component) {
				allComponents.push(component);

				if (component.children) {
					traverse(component.children);
				}
			}
		}
	}

	traverse(components);

	return allComponents;
}

/**
 * A hook that processes the conditional rules for a form and returns a map of dynamic props.
 * @param schema - The full form schema.
 * @param formData - The current data of the form.
 * @returns A memoized object mapping component IDs to their dynamically calculated props.
 */
export function useFormRules(
	schema: FormSchema,
	formData: Record<string, any>
): DynamicPropsMap {
	const dynamicProps = useMemo(() => {
		const allComponents = flattenComponents(schema.children || []);
		const propsMap: DynamicPropsMap = {};

		for (const component of allComponents) {
			if (!component.id || !component.rules) {
				continue;
			}

			for (const rule of component.rules) {
				const { when, then } = rule;
				const actualValue = formData[when.field];

				// Check if the condition is met
				if (actualValue === when.is) {
					// Process the 'then' actions
					for (const action of then) {
						if ("set" in action) {
							// Merge the props from the 'set' action into the map
							propsMap[component.id] = {
								...propsMap[component.id],
								...action.set,
							};
						}

						// TODO: Implement 'log' action if needed for debugging
						if ("log" in action) {
							console.log(
								`Rule triggered for ${component.id}:`,
								action.log
							);
						}
					}
				}
			}
		}

		return propsMap;
	}, [schema, formData]);

	return dynamicProps;
}
