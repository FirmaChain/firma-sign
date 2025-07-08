import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { libInjectCss } from "vite-plugin-lib-inject-css";

export default defineConfig({
	plugins: [react(), libInjectCss(), dts()],
	css: {
		postcss: "./postcss.config.js",
	},
	build: {
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			name: "FirmaSignDocuments",
			formats: ["es", "cjs"],
			fileName: (format) => `index.${format === "es" ? "esm" : format}.js`,
		},
		rollupOptions: {
			external: ["react", "react-dom"],
			output: {
				globals: {
					react: "React",
					"react-dom": "ReactDOM",
				},
				assetFileNames: "documents.css",
				inlineDynamicImports: false,
			},
		},
		cssCodeSplit: false,
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
	},
});
