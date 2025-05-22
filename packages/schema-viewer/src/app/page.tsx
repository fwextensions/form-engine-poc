"use client";

import { PoCForm, parseFormSchema, FormSchema } from "form-engine";
import schemaData from "@/schemas/poc-simple-form.yaml";
import { useRouter } from 'next/navigation';

export default function HomePage()
{
	const router = useRouter();

	// The imported schemaData is already a JavaScript object thanks to yaml-loader
	const schema: FormSchema | null = parseFormSchema(schemaData);

	const handleSubmit = (formData: Record<string, any>) => {
		const queryString = encodeURIComponent(JSON.stringify(formData));
		router.push(`/submission?data=${queryString}`);
	};

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
		<main className="flex min-h-screen flex-col items-start justify-start p-5 md:p-8 lg:p-12 bg-gray-100">
			<PoCForm schema={schema} onSubmit={handleSubmit} />
		</main>
	);
}
