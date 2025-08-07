# Firma-Sign Frontend

React-based web application for the Firma-Sign document signing system.

## Overview

This package provides the web interface for Firma-Sign, enabling users to:

- Upload and manage PDF documents
- Place signature fields and components on documents
- Send documents for signing via various transports
- Track document status and manage transfers

## Installation

```bash
# Install dependencies
pnpm install
```

## Development

```bash
# Start development server
pnpm dev

# The application will be available at http://localhost:5173
```

## Building

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── App.tsx                    # Main application component
├── main.tsx                   # Application entry point
├── index.css                  # Global styles with Tailwind CSS
└── components/               # React components
    ├── DocumentsModule.tsx   # Document management
    └── PDFUploader.tsx       # PDF upload functionality
```

## Key Features

- **Document Upload**: Drag-and-drop or click to upload PDF files
- **Document Editor**: Interactive editor for placing signature fields
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: WebSocket integration for live status updates
- **Multiple View Modes**: Editor, viewer, and signing modes

## Technology Stack

- **React 19**: UI framework with latest features
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Vitest**: Testing framework

## Scripts

```bash
# Development
pnpm dev          # Start dev server

# Building
pnpm build        # Build for production
pnpm preview      # Preview production build

# Code Quality
pnpm lint         # Run ESLint
pnpm lintfix      # Fix ESLint issues
pnpm format       # Format with Prettier
pnpm format:check # Check formatting

# Testing
pnpm test         # Run tests
```

## Configuration

### Vite Configuration

The application is configured in `vite.config.ts` with:

- React plugin for JSX support
- TypeScript support
- Development server settings

### Tailwind Configuration

Styling is configured in `tailwind.config.ts` with:

- Custom color schemes
- Responsive breakpoints
- Component utilities

### TypeScript Configuration

Type checking is configured in `tsconfig.json` with:

- Strict mode enabled
- JSX support for React
- Path aliases for imports

## Dependencies

### Production Dependencies

- `react`: UI library (v19.1.0)
- `react-dom`: React DOM rendering (v19.1.0)
- `@firmachain/firma-sign-documents`: Document handling components

### Development Dependencies

- `vite`: Build tool
- `typescript`: Type checking
- `tailwindcss`: CSS framework
- `eslint`: Code linting
- `prettier`: Code formatting
- `vitest`: Testing

## Integration with Backend

The frontend connects to the backend server for:

- Document storage and retrieval
- Transfer management
- WebSocket real-time updates
- Authentication and sessions

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - Frontend architecture design
- [Components](./docs/COMPONENTS.md) - Component structure and hierarchy
- [Development Guide](./docs/DEVELOPMENT.md) - Development setup and workflow
- [React 19 Features](./docs/REACT-19-FEATURES.md) - React 19 specific features

## Contributing

1. Follow the TypeScript and React best practices
2. Use functional components with hooks
3. Maintain component modularity
4. Write tests for new features
5. Run linting and formatting before commits

## License

MIT
