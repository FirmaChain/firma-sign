# Development Guide

## Prerequisites

- Node.js 16 or higher
- pnpm package manager
- TypeScript knowledge

## Setup

1. Clone the repository
2. Install dependencies:
```bash
pnpm install
```

## Development Workflow

### Building

```bash
# Build the package
pnpm build

# Build in watch mode
pnpm dev
```

### Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### Linting

```bash
# Run ESLint
pnpm lint

# Fix linting issues
pnpm lint --fix
```

### Type Checking

```bash
# Check types without building
pnpm type-check
```

## Project Structure

```
src/
├── interfaces/         # Core interfaces
│   ├── index.ts       # Interface exports
│   ├── transport.ts   # Transport interface
│   ├── document.ts    # Document types
│   ├── transfer.ts    # Transfer types
│   └── handler.ts     # Handler types
├── utils/             # Utility functions
│   ├── index.ts       # Utility exports
│   ├── hash.ts        # Hashing functions
│   ├── encryption.ts  # Encryption functions
│   └── validation.ts  # Validation functions
├── index.ts           # Main entry point
└── types.ts          # Shared types
```

## Adding New Features

### Adding a New Interface

1. Create interface file in `src/interfaces/`:
```typescript
// src/interfaces/my-interface.ts
export interface MyInterface {
  // Interface definition
}
```

2. Export from `src/interfaces/index.ts`:
```typescript
export * from './my-interface.js';
```

3. Add tests in `tests/interfaces/`

### Adding a New Utility

1. Create utility file in `src/utils/`:
```typescript
// src/utils/my-utility.ts
export function myUtility(param: string): string {
  // Implementation
}
```

2. Export from `src/utils/index.ts`:
```typescript
export * from './my-utility.js';
```

3. Add tests in `tests/utils/`
4. Document in API.md

### Updating Types

1. Update type definitions
2. Run type check: `pnpm type-check`
3. Update dependent code
4. Update documentation

## Testing Guidelines

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../src/utils/my-utility.js';

describe('myFunction', () => {
  it('should handle normal input', () => {
    expect(myFunction('input')).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(() => myFunction('')).toThrow();
  });
});
```

### Test Coverage

Aim for:
- 100% coverage for utilities
- Type testing for interfaces
- Error case coverage

## Code Style

### TypeScript Guidelines

- Use strict mode
- Explicit return types
- Proper null checking
- Avoid `any` type

### Naming Conventions

- Interfaces: PascalCase with "I" prefix optional
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case

### Documentation

- JSDoc for public APIs
- Inline comments for complex logic
- README for high-level overview

## Publishing

### Pre-publish Checklist

1. Update version in package.json
2. Update CHANGELOG
3. Run tests: `pnpm test`
4. Build package: `pnpm build`
5. Update documentation

### Publishing Process

```bash
# Dry run
npm publish --dry-run

# Publish to npm
npm publish --access public
```

## Debugging

### Debug Build

```bash
# Build with source maps
pnpm build

# Use with Node.js debugger
node --inspect-brk dist/index.js
```

### Common Issues

#### Type Errors

1. Check tsconfig.json settings
2. Verify import paths use `.js` extension
3. Run `pnpm type-check`

#### Build Errors

1. Clean dist folder: `rm -rf dist`
2. Rebuild: `pnpm build`
3. Check for circular dependencies

#### Test Failures

1. Run single test: `pnpm test path/to/test`
2. Check test isolation
3. Verify mock setup

## Contributing

### Pull Request Process

1. Fork repository
2. Create feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Update documentation
6. Submit PR with description

### Commit Messages

Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `test:` Test updates
- `refactor:` Code refactoring

## Performance Considerations

### Bundle Size

- Check with: `pnpm build && du -sh dist`
- Minimize dependencies
- Use tree-shaking friendly exports

### Runtime Performance

- Profile critical paths
- Optimize hot functions
- Consider streaming for large data

## Tooling

### Build Tool (tsup)

Configuration in `tsup.config.ts`:
- Multiple formats (CJS, ESM)
- Type declarations
- Minification for production

### Test Runner (Vitest)

Configuration in `vitest.config.ts`:
- Coverage settings
- Test environment
- Mock configuration

## Release Process

1. Update version: `npm version patch|minor|major`
2. Generate changelog
3. Run full test suite
4. Build and verify
5. Publish to npm
6. Create GitHub release