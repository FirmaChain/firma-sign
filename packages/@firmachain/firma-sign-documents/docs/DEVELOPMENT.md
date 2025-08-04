# Development Guide

## Prerequisites

- Node.js 18+
- pnpm
- Basic React knowledge
- Understanding of PDF.js

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Start development:
```bash
pnpm dev
```

3. Open Storybook:
```bash
pnpm storybook
```

## Project Structure

```
src/
├── components/
│   └── Editor/
│       ├── Components/      # Document components
│       ├── Editor.tsx       # Main editor
│       ├── hooks/          # Custom hooks
│       ├── utils/          # Utilities
│       └── types.ts        # TypeScript types
├── assets/                 # Static assets
├── styles.css             # Global styles
└── index.ts               # Package exports
```

## Development Workflow

### Creating a New Component

1. Create component file:
```tsx
// src/components/Editor/Components/MyComponent.tsx
import React from 'react';
import { BaseComponentProps } from '../types';

export const MyComponent: React.FC<BaseComponentProps> = ({
  id,
  position,
  size,
  isSelected,
  onUpdate
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height
      }}
    >
      {/* Component content */}
    </div>
  );
};
```

2. Add to ComponentFactory:
```tsx
// src/components/Editor/ComponentFactory.tsx
case 'my-component':
  return <MyComponent {...props} />;
```

3. Create Storybook story:
```tsx
// src/components/Editor/Components/MyComponent.stories.tsx
export default {
  title: 'Components/MyComponent',
  component: MyComponent
};

export const Default = {
  args: {
    position: { x: 100, y: 100 },
    size: { width: 200, height: 100 }
  }
};
```

### Working with PDF.js

#### Loading PDFs
```typescript
import { loadPDFDocument } from './utils/pdfUtils';

const doc = await loadPDFDocument(file);
```

#### Rendering Pages
```typescript
import { Page } from 'react-pdf';

<Page
  pageNumber={1}
  width={800}
  renderTextLayer={false}
  renderAnnotationLayer={false}
/>
```

### State Management

#### Component State
```typescript
const [components, setComponents] = useState<ComponentData[]>([]);

const addComponent = (component: ComponentData) => {
  setComponents(prev => [...prev, component]);
};
```

#### Selection State
```typescript
const [selectedId, setSelectedId] = useState<string | null>(null);

const selectComponent = (id: string) => {
  setSelectedId(id);
};
```

### Styling Guidelines

#### Component Styles
```css
.component {
  position: absolute;
  border: 2px solid transparent;
  cursor: move;
}

.component--selected {
  border-color: var(--primary-color);
}
```

#### Using Tailwind
```tsx
<div className="absolute border-2 border-transparent hover:border-blue-500">
  {/* Content */}
</div>
```

### Testing

#### Unit Tests
```typescript
import { render, fireEvent } from '@testing-library/react';
import { SignatureComponent } from './SignatureComponent';

test('renders signature component', () => {
  const { container } = render(
    <SignatureComponent
      id="test"
      position={{ x: 0, y: 0 }}
      size={{ width: 200, height: 80 }}
    />
  );
  
  expect(container.firstChild).toBeInTheDocument();
});
```

#### Integration Tests
```typescript
test('adds component to document', async () => {
  const { getByText, getAllByTestId } = render(<Editor />);
  
  fireEvent.click(getByText('Signature'));
  fireEvent.click(document.querySelector('.pdf-page'));
  
  expect(getAllByTestId('component')).toHaveLength(1);
});
```

### Performance Tips

#### Memoization
```tsx
const MemoizedComponent = React.memo(MyComponent, (prev, next) => {
  return prev.id === next.id && 
         prev.isSelected === next.isSelected;
});
```

#### Lazy Loading
```tsx
const HeavyComponent = React.lazy(() => 
  import('./Components/HeavyComponent')
);
```

#### Virtualization
```tsx
// Only render visible pages
const visiblePages = pages.filter(page => 
  isPageInViewport(page, viewport)
);
```

### Debugging

#### Debug Mode
```typescript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  console.log('Component state:', components);
}
```

#### React DevTools
- Use React DevTools to inspect component tree
- Check prop values and state
- Profile performance

#### PDF.js Debugging
```typescript
// Enable PDF.js logging
window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;
```

### Common Tasks

#### Adding a New Export Format
```typescript
export async function exportToFormat(
  document: PDFDocument,
  components: ComponentData[],
  format: 'json' | 'xml'
): Promise<string> {
  switch (format) {
    case 'json':
      return JSON.stringify({ document, components });
    case 'xml':
      return convertToXML({ document, components });
  }
}
```

#### Customizing Component Appearance
```tsx
const CustomSignature = styled(SignatureComponent)`
  border: 2px dashed #007bff;
  background-color: rgba(0, 123, 255, 0.1);
`;
```

#### Handling Keyboard Shortcuts
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Delete' && selectedId) {
      deleteComponent(selectedId);
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [selectedId]);
```

### Build and Deployment

#### Building the Package
```bash
# Build for production
pnpm build

# Build with watch mode
pnpm dev
```

#### Publishing
```bash
# Dry run
npm publish --dry-run

# Publish
npm publish --access public
```

### Troubleshooting

See [EDITOR-TROUBLESHOOTING.md](./EDITOR-TROUBLESHOOTING.md) for common issues.

### Contributing

1. Follow TypeScript strict mode
2. Add tests for new features
3. Update Storybook stories
4. Document API changes
5. Run linting before commit