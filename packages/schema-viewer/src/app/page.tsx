import fs from 'fs';
import path from 'path';
import { PoCForm, parseFormSchema, FormSchema } from 'form-engine';

// Determine the absolute path to the YAML schema file
// process.cwd() in Next.js app router context (for schema-viewer) should be the root of the schema-viewer package.
const schemaFilePath = path.join(process.cwd(), 'src', 'schemas', 'poc-simple-form.yaml');
let rawYamlSchema: string;

try {
  rawYamlSchema = fs.readFileSync(schemaFilePath, 'utf8');
} catch (error: any) {
  console.error(`Error reading YAML schema file from ${schemaFilePath}:`, error.message);
  // Fallback to a minimal schema to allow the page to render an error message
  // The existing error handling in HomePage will catch if parseFormSchema returns null
  rawYamlSchema = 'formName: Schema Load Error\nsteps: []';
}

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
