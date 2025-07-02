import React, { useState } from "react";
import { Control } from "@radix-ui/react-form";
import { FormEngineContext } from "../../../engine/FormEngineContext";
import { FormFieldContainer, FormFieldContainerProps } from "../../layout/FormFieldContainer";
import { AddressValidationFieldConfig, addressValidationFieldConfigSchema, transformConfig } from "./schema";
import addressValidationService, { Address, AddressValidationResult } from "./AddressValidationService";
import { createComponent } from "../../../core/componentFactory";

// --- Helper Components ---
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
	<Control asChild>
		<input
			ref={ref}
			{...props}
			className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
		/>
	</Control>
));

// --- Main Component ---
type ValidationStatus = "idle" | "validating" | "validated" | "error";

export interface AddressValidationProps {
	containerProps: Omit<FormFieldContainerProps, "children">;
	initialValue?: Address;
	onChange: (value: Address | null) => void;
}

export const AddressValidation: React.FC<AddressValidationProps> = ({
	containerProps,
	initialValue,
	onChange,
}) => {
	const [address, setAddress] = useState<Address>(
		initialValue || { street1: "", street2: "", city: "", state: "", zip: "" }
	);
	const [status, setStatus] = useState<ValidationStatus>(initialValue ? "validated" : "idle");
	const [validatedAddress, setValidatedAddress] = useState<Address | null>(initialValue || null);
	const [validationError, setValidationError] = useState<string | null>(null);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setAddress((prev) => ({ ...prev, [name]: value }));
	};

	const handleValidate = async () => {
		setStatus("validating");
		setValidationError(null);
		const result: AddressValidationResult = await addressValidationService.validateAddress(address);

		if (result.success) {
			if (result.isValid) {
				setValidatedAddress(result.validatedAddress);
				setStatus("validated");
			} else {
				setValidationError(result.errors.join(", "));
				setStatus("error");
			}
		} else {
			setValidationError(result.error);
			setStatus("error");
		}
	};

	const handleConfirm = () => {
		if (validatedAddress) {
			onChange(validatedAddress);
		}
	};

	const handleEdit = () => {
		setStatus("idle");
		onChange(null);
	};

	return (
		<FormFieldContainer {...containerProps}>
			{status !== "validated" && (
				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-y-2 gap-x-4 sm:grid-cols-6">
						<div className="sm:col-span-6">
							<Input name="street1" placeholder="Street Address" value={address.street1} onChange={handleInputChange} />
						</div>
						<div className="sm:col-span-6">
							<Input name="street2" placeholder="Apt or Unit #" value={address.street2 || ""} onChange={handleInputChange} />
						</div>
						<div className="sm:col-span-2">
							<Input name="city" placeholder="City" value={address.city} onChange={handleInputChange} />
						</div>
						<div className="sm:col-span-2">
							<Input name="state" placeholder="State" value={address.state} onChange={handleInputChange} />
						</div>
						<div className="sm:col-span-2">
							<Input name="zip" placeholder="ZIP Code" value={address.zip} onChange={handleInputChange} />
						</div>
					</div>
					<div className="flex items-center space-x-4">
						<button onClick={handleValidate} disabled={status === "validating"} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
							{status === "validating" ? "Validating..." : "Validate Address"}
						</button>
						{status === "error" && validationError && (
							<p className="text-sm text-red-600">{validationError}</p>
						)}
					</div>
				</div>
			)}

			{status === "validated" && validatedAddress && (
				<div className="space-y-4">
					<div>
						<h4 className="text-base font-medium text-gray-900">Please confirm your address:</h4>
						<div className="mt-2 p-4 bg-gray-50 rounded-md border border-gray-200">
							<p className="text-sm text-gray-800">
								{validatedAddress.street1}<br />
								{validatedAddress.street2 && (<>{validatedAddress.street2}<br /></>)}
								{validatedAddress.city}, {validatedAddress.state} {validatedAddress.zip}
							</p>
						</div>
					</div>
					<div className="flex space-x-3">
						<button onClick={handleConfirm} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
							Address is Correct
						</button>
						<button onClick={handleEdit} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
							Edit Address
						</button>
					</div>
				</div>
			)}
		</FormFieldContainer>
	);
};

// --- Component Registration ---
const transformProps = (config: AddressValidationFieldConfig, context: FormEngineContext): AddressValidationProps => {
	const { id, label, description } = config;
	const { formData, onDataChange } = context;

	if (!id) {
		throw new Error("AddressValidation component requires an id.");
	}

	return {
		containerProps: {
			name: id,
			label,
			description,
		},
		initialValue: formData[id] as Address | undefined,
		onChange: (value) => onDataChange(id, value),
	};
};

createComponent<AddressValidationFieldConfig, AddressValidationProps>({
	type: "addressValidation",
	component: AddressValidation,
	schema: addressValidationFieldConfigSchema,
	transformConfig,
	transformProps,
});
