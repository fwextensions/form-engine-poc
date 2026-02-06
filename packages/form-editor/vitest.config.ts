import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
		css: false,
		setupFiles: ["./vitest.setup.ts"],
	},
	// Disable PostCSS in test environment
	css: {
		postcss: false as any,
	},
});
