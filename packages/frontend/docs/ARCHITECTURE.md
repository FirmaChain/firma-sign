# Frontend Architecture

## Overview

The Firma-Sign frontend is a React-based single-page application (SPA) that provides a user interface for document signing and management. It follows a component-based architecture with clear separation of concerns.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│     (React Components + Tailwind)       │
├─────────────────────────────────────────┤
│          State Management               │
│      (React Hooks + Context API)        │
├─────────────────────────────────────────┤
│         Business Logic                  │
│    (Custom Hooks + Utilities)           │
├─────────────────────────────────────────┤
│        External Libraries               │
│  (firma-sign-documents, pdf.js, etc.)   │
├─────────────────────────────────────────┤
│           API Layer                     │
│    (REST API + WebSocket - planned)     │
└─────────────────────────────────────────┘
```

## Component Architecture

### Component Hierarchy

```
App (Root Component)
├── Header (Application header)
└── DocumentsModule (Main content area)
    ├── PDFUploader (Upload interface)
    │   ├── DropZone
    │   ├── FileInput
    │   └── UploadStatus
    └── Editor (Document editor from firma-sign-documents)
        ├── PDFViewer
        ├── ComponentPalette
        ├── PropertiesPanel
        └── ExportPanel
```

### Component Design Principles

1. **Single Responsibility**: Each component has one clear purpose
2. **Composition over Inheritance**: Use component composition
3. **Props Interface**: Clear TypeScript interfaces for all props
4. **Controlled Components**: Form inputs are controlled
5. **Accessibility**: ARIA labels and keyboard navigation

## State Management Strategy

### Local State

- Component-specific state using `useState`
- Form inputs and UI toggles
- Temporary data that doesn't need sharing

### Lifted State

- Shared between parent and child components
- Document data passed down via props
- Callbacks for state updates

### Global State (Planned)

- Context API for user authentication
- WebSocket connection state
- Application-wide settings

## Data Flow

### Upload Flow

```
User Action → PDFUploader → File Validation → FileReader API
    → Base64 Conversion → DocumentsModule → Editor Component
```

### Edit Flow

```
Editor Interaction → Component Placement → State Update
    → Re-render → Visual Update
```

### Save Flow (Planned)

```
Save Action → Collect Components → API Request → Server Storage
    → Success Response → UI Update
```

## Styling Architecture

### Tailwind CSS Strategy

- Utility-first approach
- Custom component classes in index.css
- Responsive design with mobile-first
- Dark mode support (planned)

### CSS Organization

```
index.css
├── Tailwind Directives
├── Custom Base Styles
├── Component Styles
└── Utility Classes
```

## Performance Optimizations

### Code Splitting

- Dynamic imports for heavy components
- Lazy loading of PDF.js worker
- Route-based splitting (when routing added)

### Memoization

- `React.memo` for expensive components
- `useMemo` for computed values
- `useCallback` for stable function references

### Bundle Optimization

- Tree shaking with Vite
- Minification in production
- Source maps for debugging

## Build Architecture

### Development Build

```
Vite Dev Server → Hot Module Replacement → Fast Refresh
    → TypeScript Compilation → Browser
```

### Production Build

```
TypeScript Check → ESLint → Build → Minification
    → Bundle Splitting → Output to dist/
```

## Security Considerations

### Content Security Policy

- Restrict script sources
- Prevent XSS attacks
- Sanitize user inputs

### Data Validation

- Client-side validation for UX
- File type and size checks
- Input sanitization

## Testing Architecture

### Unit Tests

- Component testing with Vitest
- React Testing Library for interactions
- Mock external dependencies

### Integration Tests

- User flow testing
- API integration tests
- End-to-end scenarios

## Deployment Architecture

### Static Hosting

- Build to static files
- CDN distribution
- Cache strategies

### Environment Configuration

- Environment variables via .env
- Build-time configuration
- Runtime configuration (planned)

## Future Architecture Enhancements

### Planned Features

1. **Routing**: React Router for multi-page navigation
2. **State Management**: Redux or Zustand for complex state
3. **Real-time Updates**: WebSocket integration
4. **PWA Support**: Service workers and offline capability
5. **Internationalization**: Multi-language support

### Scalability Considerations

1. **Micro-frontends**: Module federation for large teams
2. **Component Library**: Shared UI components
3. **Design System**: Consistent design tokens
4. **Performance Monitoring**: Analytics and error tracking

## Technology Stack

### Core Technologies

- **React 19**: Latest UI library with enhanced features and performance
  - Improved performance with automatic batching
  - Enhanced Suspense and concurrent features
  - Better error handling and recovery
  - Improved hydration and server components support (future)
- **TypeScript**: Type safety and better DX
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework

### Key Libraries

- **@firmachain/firma-sign-documents**: Document editing components
- **pdf.js**: PDF rendering engine
- **React 19 Hooks**: Latest hooks with improved performance and features

### Development Tools

- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Vitest**: Testing framework
- **pnpm**: Package management

## File Structure Conventions

### Naming Conventions

- **Components**: PascalCase (DocumentsModule.tsx)
- **Utilities**: camelCase (validateFile.ts)
- **Styles**: kebab-case (index.css)
- **Constants**: UPPER_SNAKE_CASE

### Folder Structure

```
src/
├── components/       # React components
├── hooks/           # Custom hooks (planned)
├── utils/           # Utility functions (planned)
├── services/        # API services (planned)
├── types/           # TypeScript types (planned)
└── assets/          # Static assets (planned)
```

## Best Practices

1. **Component Design**
   - Keep components small and focused
   - Extract reusable logic to hooks
   - Use composition patterns

2. **State Management**
   - Minimize state
   - Colocate state with usage
   - Use derived state when possible

3. **Performance**
   - Lazy load heavy components
   - Optimize re-renders
   - Use production builds

4. **Code Quality**
   - TypeScript strict mode
   - ESLint rules enforcement
   - Consistent formatting
