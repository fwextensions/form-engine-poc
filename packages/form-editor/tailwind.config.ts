import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"../form-engine/src/**/*.{js,ts,jsx,tsx}",
		"./node_modules/streamdown/dist/*.js",
		"./node_modules/@streamdown/code/dist/*.js",
	],
	theme: {
		extend: {
			// You can add custom theme extensions here if needed
		},
	},
	plugins: [],
};

export default config;
