import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import yaml from "@rollup/plugin-yaml";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "src",
  plugins: [
		tailwindcss(),
		react(),
		yaml()
	],
  resolve: {
    alias: {
      "form-engine": "../../form-engine/src",
    },
  },
  server: {
    open: true,
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
