import { PoCForm, parseFormSchema, FormSchema } from 'form-engine';

// Raw YAML content (simulating loading from a file for PoC) - Updated for M3
const rawYamlSchema = `
formName: PoC Multi-Step Form
steps:
  - id: personal_info
    title: Personal Information
    fields:
      - id: user_name
        type: text
        label: Your Full Name
        placeholder: "John Doe"
        validation:
          required: true
      - id: user_email
        type: email
        label: Your Email Address
        placeholder: "name@example.com"
        validation:
          required: true
      - id: birth_date
        type: date
        label: Date of Birth
        validation:
          required: false
  - id: preferences_comments
    title: Preferences & Comments
    fields:
      - id: favorite_color
        type: select
        label: Favorite Color
        options:
          - value: ""
            label: "Select a color"
          - value: "red"
            label: "Red"
          - value: "blue"
            label: "Blue"
          - value: "green"
            label: "Green"
        validation:
          required: true
      - id: contact_preference
        type: radio
        label: Preferred Contact Method
        options:
          - value: "email"
            label: "Email"
          - value: "phone"
            label: "Phone"
        validation:
          required: true
      - id: newsletter_subscribe
        type: checkbox
        label: Subscribe to newsletter
      - id: comments
        type: textarea
        label: Additional Comments
        placeholder: "Enter any comments here..."
`;

export default function HomePage() {
	const schema: FormSchema | null = parseFormSchema(rawYamlSchema);

	if (!schema) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center p-24 bg-red-100">
				<div className="text-red-700 font-bold text-xl">
					Error: Could not parse form schema. Check console for details.
				</div>
			</main>
		);
	}

	return (
		<main className="flex min-h-screen flex-col items-start justify-start p-5 md:p-12 lg:p-24 bg-gray-100">
			<PoCForm schema={schema} />
		</main>
	);
}
