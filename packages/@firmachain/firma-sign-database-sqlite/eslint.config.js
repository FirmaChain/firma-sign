import js from '@eslint/js';
import typescript from 'typescript-eslint';

export default [
	js.configs.recommended,
	...typescript.configs.recommended,
	{
		files: ['src/**/*.ts'],
		ignores: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			parser: typescript.parser,
			parserOptions: {
				project: './tsconfig.json',
			},
		},
		rules: {
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-non-null-assertion': 'warn',
		},
	},
	{
		files: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			parser: typescript.parser,
		},
		rules: {
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
	{
		ignores: ['dist/**', 'node_modules/**', '*.config.ts', '*.config.js', 'coverage/**', 'src/__tests__/**'],
	},
];