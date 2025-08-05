import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    only: false,
    resolve: true
  },
  clean: true,
  minify: false,
  splitting: false,
  sourcemap: true,
  external: ['@firmachain/firma-sign-core'],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs'
    };
  },
  esbuildOptions(options) {
    options.tsconfig = 'tsconfig.json';
  }
});