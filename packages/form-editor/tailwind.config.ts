import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		// Path to the form-engine package
		"../form-engine/src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			// You can add custom theme extensions here if needed
		},
	},
	plugins: [],
};

export default config;
