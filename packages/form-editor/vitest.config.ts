import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
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
	// Override postcss to prevent it from loading
	css: false,
});
