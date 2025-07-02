## Address Validation Flow in Short Form Application

The address validation system in DAHLIA's Short Form Application collects, validates, and processes address information through a coordinated flow between frontend validation, backend processing, and user confirmation steps.

The goal of this spec is to build a form field component that can be used in a schema supplied to the `FormEngine` component.  The component type could be `addressValidation` and it should register itself using the `createComponent()` function, like any other form field.

The `addressValidation` component should handle the following tasks, as described in more detail below:

- Collect address information from users
- Validate address against postal/GIS data
- Display error messages for invalid addresses
- Provide a confirmation step for users to confirm validated addresses

This work does not need to include a full short form application.  It just needs to implement a standardized address validation flow that can be included in a form schema.


### Address Information Collection

The system collects comprehensive address information from users at multiple points in the application:

**Primary Applicant Address Collection:**
- Home address (required for all applicants)
- Mailing address (optional, can be same as home address)
- Address fields include: address1, address2, city, state, zip

### Frontend Address Validation

The frontend performs initial validation checks before sending data to the backend:

**Input Validation Functions:**
- `addressInputInvalid()` - Checks if required address fields are filled and valid
- `addressValidationError()` - Displays backend validation errors
- Field-level validation for address1, city, state, and zip

### Backend Address Processing

When users submit address information, the system triggers validation through the `AddressValidationService`:

**Primary Applicant Address Validation Flow:**
1. User completes contact form with address
2. System calls `checkIfAddressVerificationNeeded()`
3. If address hasn't been confirmed, calls `validateApplicantAddress()`
4. On success, navigates to verify-address page
5. On error, sets `addressError = true` and shows error state

### Address Validation Service Integration

The system integrates with an external address validation service that uses EasyPost:

**Validation Process:**
1. Calls `AddressValidationService.validate()` with address object
2. Returns promise that resolves on valid address or rejects on invalid
3. Sets verification flags in application state
4. Handles different error types (422 for invalid address, other codes for service errors)

### Error Handling and User Feedback

The system provides comprehensive error handling with user-friendly messages:

**Error Types and Messages:**
- **PO BOX**: "We need the address where you currently live. PO Boxes are not allowed."
- **DUPLICATE UNIT**: "If you have an apartment or unit number, only enter it in the Apt or Unit # box."
- **ADDRESS NOT FOUND**: Comprehensive error with email contact option for help

**Error Display Component:**
The `addressError` component dynamically generates error messages and provides contact information for unresolvable address issues.

### User Confirmation Flow

After successful validation, users are presented with a confirmation step:

**Verification Page:**
- Shows the validated/corrected address
- Asks user to confirm it's correct
- Allows proceeding to next section or going back to edit

### Navigation Integration

Address validation is integrated into the application's navigation flow:

**Navigation Actions:**
- Contact page triggers `checkIfAddressVerificationNeeded`
- Verify-address page triggers `checkPreferenceEligibility`
- Navigation skips verification if address already confirmed

### State Management

The application maintains address validation state:

**State Tracking:**
- `preferenceAddressMatch` - Tracks if address has been validated
- `validatedForms` - Tracks which forms have been completed
- `addressError` - Boolean flag for displaying error states
- Address changes invalidate related forms and preferences

## Implementation Guidelines

To implement a similar UI, you would need:

1. **Form Fields**: Use Radix UI components for address fields
2. **Validation Service**: Backend service to validate addresses against postal/GIS data
3. **Error Handling**: Component to display different error types with appropriate messaging
4. **Confirmation Step**: Separate page/modal to confirm validated addresses
5. **State Management**: Track validation status and prevent re-validation of confirmed addresses
6. **Navigation Logic**: Skip validation for already-confirmed addresses or same-as-primary scenarios


## Example Implementation of Address Validation

This React hook could be used to implement address validation in a form.  The default `baseUrl` is https://housing.sfgov.org/.

```js
// useAddressValidation.js

class AddressValidationService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || '';
  }

  async validateAddress(address) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/addresses/validate.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Address validation failed');
      }

      return {
        success: true,
        validatedAddress: data.address,
        isValid: data.success,
        errors: data.errors || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        isValid: false
      };
    }
  }

  async getGISData(address, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/gis/geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          ...options
        })
      });

      const data = await response.json();

      return {
        success: response.ok,
        gisData: data.gis_data,
        boundaryMatch: data.gis_data?.boundary_match
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// React hook for address validation
export const useAddressValidation = (baseUrl) => {
  const [validationState, setValidationState] = useState({
    isValidating: false,
    validatedAddress: null,
    errors: [],
    isValid: false
  });

  const service = useMemo(() => new AddressValidationService(baseUrl), [baseUrl]);

  const validateAddress = useCallback(async (address) => {
    setValidationState(prev => ({ ...prev, isValidating: true }));

    const result = await service.validateAddress(address);

    setValidationState({
      isValidating: false,
      validatedAddress: result.validatedAddress,
      errors: result.errors || [],
      isValid: result.isValid,
      success: result.success
    });

    return result;
  }, [service]);

  const validateWithGIS = useCallback(async (address, options) => {
    const validationResult = await validateAddress(address);

    if (validationResult.success && validationResult.isValid) {
      const gisResult = await service.getGISData(validationResult.validatedAddress, options);
      return {
        ...validationResult,
        gisData: gisResult.gisData,
        boundaryMatch: gisResult.boundaryMatch
      };
    }

    return validationResult;
  }, [validateAddress, service]);

  return {
    ...validationState,
    validateAddress,
    validateWithGIS
  };
};
```
