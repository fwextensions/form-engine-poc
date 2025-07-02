export interface Address {
	street1: string;
	street2?: string;
	city: string;
	state: string;
	zip: string;
}

export interface AddressValidationSuccess {
	success: true;
	validatedAddress: Address;
	isValid: boolean;
	errors: string[];
}

export interface AddressValidationFailure {
	success: false;
	error: string;
	isValid: false;
}

export type AddressValidationResult = AddressValidationSuccess | AddressValidationFailure;

class AddressValidationService {
	private baseUrl: string;

	constructor(baseUrl: string = "") {
		this.baseUrl = baseUrl;
	}

	async validateAddress(address: Address): Promise<AddressValidationResult> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/addresses/validate.json`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ address }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.message || "Address validation failed");
			}

			if (data.error) {
				return {
					success: false,
					error: data.error.message,
					isValid: false,
				};
			}

			const deliveryVerification = data.address?.verifications?.delivery;

			if (!deliveryVerification) {
				return {
					success: false,
					error: "Incomplete address verification data received.",
					isValid: false,
				};
			}

			return {
				success: true,
				validatedAddress: data.address,
				isValid: deliveryVerification.success,
				errors: deliveryVerification.errors.map((err: any) => err.message) || [],
			};
		} catch (error: any) {
			return {
				success: false,
				error: error.message,
				isValid: false,
			};
		}
	}

	// In a real application, you would also implement getGISData
}

export default new AddressValidationService();
