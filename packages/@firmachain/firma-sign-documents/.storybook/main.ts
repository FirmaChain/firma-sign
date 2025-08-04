import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	addons: [
		'@storybook/addon-links',
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
	],
	framework: {
		name: '@storybook/react-vite',
		options: {},
	},
	docs: {
		autodocs: 'tag',
	},
	viteFinal: async (config) => {
		return {
			...config,
			resolve: {
				...config.resolve,
				alias: {
					...config.resolve?.alias,
					react: path.resolve(__dirname, '../node_modules/react'),
					'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
				},
			},
			server: {
				proxy: {
					'/wcoomd': {
						target: 'https://mag.wcoomd.org',
						changeOrigin: true,
						secure: false,
						rewrite: (path) => path.replace(/^\/wcoomd/, ''),
					},
				},
			},
			optimizeDeps: {
				...config.optimizeDeps,
				exclude: [...(config.optimizeDeps?.exclude || []), 'pdfjs-dist'],
			},
			assetsInclude: [
				...(Array.isArray(config.assetsInclude) ? config.assetsInclude : config.assetsInclude ? [config.assetsInclude] : []), 
				'**/*.worker.js'
			],
			plugins: [
				...(config.plugins || []),
				// Copy PDF worker to Storybook static assets
				{
					name: 'copy-pdf-worker-storybook',
					configureServer() {
						const workerPath = path.resolve(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
						const outputDir = path.resolve(__dirname, '../storybook-static');
						
						if (!existsSync(outputDir)) {
							mkdirSync(outputDir, { recursive: true });
						}
						
						if (existsSync(workerPath)) {
							copyFileSync(workerPath, path.resolve(outputDir, 'pdf.worker.min.js'));
						}
					}
				}
			],
		};
	},
};

export default config;
