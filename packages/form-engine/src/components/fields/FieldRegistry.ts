import { ComponentType } from "react";
import { FormField } from "@/services/schemaParser";
import {
	FieldComponent,
	FieldComponentProps,
	FieldDefinition,
	RegisterFieldFn
} from "./types";

type FieldRegistryType = {
	[key: string]: FieldDefinition;
};

class FieldRegistry {
	private fields: FieldRegistryType = {};

	/**
	 * Register a new field type with its definition
	 */
	registerField(
		type: string,
		definition: FieldDefinition): void
	{
		if (this.fields[type]) {
			console.warn(
				`Field type '${type}' is already registered. Overwriting...`);
		}
		this.fields[type] = definition;
	}

	/**
	 * Get the field definition for a specific type
	 */
	getFieldDefinition(type: string): FieldDefinition | null
	{
		const definition = this.fields[type];
		if (!definition) {
			console.warn(`No field definition found for type: ${type}`);
			return null;
		}
		return definition;
	}

	/**
	 * Get the component for a specific field type
	 */
	getFieldComponent(type: string): React.ComponentType<any> | null
	{
		const definition = this.getFieldDefinition(type);
		if (!definition) {
			return null;
		}

		// Return a wrapper component that handles the field rendering
		const FieldComponent: React.FC<any> = (props) => {
			return definition.render({
				...props,
				field: props.field || {},
			});
		};

		return FieldComponent;
	}

	/**
	 * Check if a field type is registered
	 */
	hasFieldType(type: string): boolean
	{
		return type in this.fields;
	}

	/**
	 * Get all registered field types
	 */
	getRegisteredTypes(): string[]
	{
		return Object.keys(this.fields);
	}
}

// Create a singleton instance
const fieldRegistry = new FieldRegistry();

// Export the instance as default
export default fieldRegistry;
