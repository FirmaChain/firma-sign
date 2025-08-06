import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    resolve: true,
    entry: './src/index.ts',
    compilerOptions: {
      composite: false
    }
  },
  clean: true,
  sourcemap: false,
  minify: false,
  target: 'es2022',
  external: ['@firmachain/firma-sign-core'],
  tsconfig: 'tsconfig.json',
  noExternal: ['nanoid']
});