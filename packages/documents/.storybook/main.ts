import type { StorybookConfig } from '@storybook/react-vite';

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
		};
	},
};

export default config;
