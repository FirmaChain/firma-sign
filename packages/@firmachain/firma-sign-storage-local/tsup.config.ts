import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['cjs', 'esm'],
	dts: false, // We'll use tsc for declaration files
	sourcemap: true,
	clean: true,
	treeshake: true,
	minify: false,
	external: ['@firmachain/firma-sign-core'],
});