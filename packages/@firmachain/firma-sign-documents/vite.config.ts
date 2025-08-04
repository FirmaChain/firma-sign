import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

export default defineConfig({
	plugins: [
		react(),
		libInjectCss(),
		dts({
			exclude: ['**/*.stories.tsx', '**/*.stories.ts'],
		}),
		// Copy PDF worker to build output
		{
			name: 'copy-pdf-worker',
			generateBundle() {
				const workerPath = resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
				const outputDir = resolve(__dirname, 'dist');

				if (!existsSync(outputDir)) {
					mkdirSync(outputDir, { recursive: true });
				}

				if (existsSync(workerPath)) {
					copyFileSync(workerPath, resolve(outputDir, 'pdf.worker.min.js'));
				}
			},
		},
	],
	css: {
		postcss: './postcss.config.js',
	},
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'FirmaSignDocuments',
			formats: ['es', 'cjs'],
			fileName: (format) => `index.${format === 'es' ? 'esm' : format}.js`,
		},
		rollupOptions: {
			external: ['react', 'react-dom', 'react/jsx-runtime'],
			output: {
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM',
					'react/jsx-runtime': 'React',
				},
				assetFileNames: 'documents.css',
				inlineDynamicImports: false,
			},
		},
		cssCodeSplit: false,
	},
	optimizeDeps: {
		exclude: ['pdfjs-dist'],
	},
	assetsInclude: ['**/*.worker.js'],
});
