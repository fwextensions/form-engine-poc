import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
	{
		ignores: [
			".next/**",
			"node_modules/**",
			"dist/**",
			"build/**",
			"*.config.js",
			"*.config.mjs",
			"*.config.ts",
		],
	},
	{ files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
	{ languageOptions: { globals: { ...globals.browser, ...globals.node } } },
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		plugins: {
			react: pluginReact,
			"react-hooks": pluginReactHooks,
		},
		rules: {
			...pluginReact.configs.recommended.rules,
			...pluginReact.configs["jsx-runtime"].rules,
			...pluginReactHooks.configs.recommended.rules,
			"react/react-in-jsx-scope": "off",
			"@typescript-eslint/no-explicit-any": "warn",
		},
		settings: {
			react: {
				version: "detect",
			},
		},
	},
];
