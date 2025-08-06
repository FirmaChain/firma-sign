module.exports = {
  // Run turbo lint on all TypeScript/JavaScript files in packages
  'packages/**/*.{ts,tsx,js,jsx,mjs,cjs}': (files) => {
    // Run turbo lint which will handle linting for affected packages
    return [`pnpm turbo lint`];
  },
  // Format other files with prettier
  '*.{json,md,yml,yaml,css}': ['prettier --write'],
  'packages/**/*.{json,md,yml,yaml,css}': ['prettier --write'],
};