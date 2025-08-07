# Development Guide

## Prerequisites

- Node.js 18 or higher
- pnpm package manager
- Basic knowledge of React and TypeScript

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open browser at http://localhost:3000
```

### Development Commands

| Command             | Description                    |
| ------------------- | ------------------------------ |
| `pnpm dev`          | Start Vite dev server with HMR |
| `pnpm build`        | Build for production           |
| `pnpm preview`      | Preview production build       |
| `pnpm test`         | Run tests with Vitest          |
| `pnpm lint`         | Run ESLint                     |
| `pnpm lintfix`      | Fix ESLint issues              |
| `pnpm format`       | Format with Prettier           |
| `pnpm format:check` | Check formatting               |

## Project Structure

```
packages/frontend/
├── src/                        # Source code
│   ├── App.tsx                # Root component
│   ├── main.tsx              # Entry point
│   ├── index.css             # Global styles
│   └── components/           # React components
│       ├── DocumentsModule.tsx
│       └── PDFUploader.tsx
├── public/                    # Static assets
├── dist/                     # Build output
├── docs/                     # Documentation
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind CSS config
├── tsconfig.json            # TypeScript config
├── eslint.config.js         # ESLint config
└── package.json             # Package config
```

## Development Workflow

### 1. Component Development

#### Creating a New Component

```tsx
// src/components/MyComponent.tsx
import type React from 'react';

interface MyComponentProps {
	title: string;
	onAction?: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
	return (
		<div className="p-4 bg-white rounded-lg shadow">
			<h2 className="text-lg font-semibold">{title}</h2>
			<button onClick={onAction} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
				Action
			</button>
		</div>
	);
};

export default MyComponent;
```

#### Component Best Practices

1. **Use TypeScript**: Define props interfaces
2. **Functional Components**: Use hooks over class components
3. **Memoization**: Use React.memo for expensive components
4. **Error Boundaries**: Wrap components that might fail
5. **Accessibility**: Include ARIA labels and keyboard support

### 2. Styling with Tailwind CSS

#### Using Tailwind Classes

```tsx
// Responsive design
<div className="w-full md:w-1/2 lg:w-1/3">

// State variants
<button className="bg-blue-500 hover:bg-blue-600 focus:ring-2">

// Dark mode (when configured)
<div className="bg-white dark:bg-gray-800">
```

#### Custom Styles

```css
/* src/index.css */
@layer components {
	.btn-primary {
		@apply px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600;
	}

	.card {
		@apply p-4 bg-white rounded-lg shadow-md;
	}
}
```

### 3. State Management

#### Local State

```tsx
const [value, setValue] = useState<string>('');
const [items, setItems] = useState<Item[]>([]);
```

#### Lifting State

```tsx
// Parent
const [sharedData, setSharedData] = useState();

// Pass to children
<Child data={sharedData} onUpdate={setSharedData} />;
```

#### Custom Hooks

```tsx
// hooks/useDebounce.ts
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
```

### 4. API Integration

#### Basic Fetch

```tsx
const fetchData = async () => {
	try {
		const response = await fetch('/api/endpoint');
		const data = await response.json();
		setData(data);
	} catch (error) {
		setError(error);
	}
};
```

#### Custom API Hook

```tsx
const useApi = (url: string) => {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetch(url)
			.then((res) => res.json())
			.then(setData)
			.catch(setError)
			.finally(() => setLoading(false));
	}, [url]);

	return { data, loading, error };
};
```

## Testing

### Unit Testing

```tsx
// src/components/__tests__/PDFUploader.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import PDFUploader from '../PDFUploader';

describe('PDFUploader', () => {
	it('handles file upload', async () => {
		const onUpload = vi.fn();
		render(<PDFUploader onUpload={onUpload} onClear={() => {}} hasUploadedFile={false} />);

		const file = new File(['content'], 'test.pdf', {
			type: 'application/pdf',
		});

		const input = screen.getByRole('button');
		fireEvent.change(input, { target: { files: [file] } });

		await waitFor(() => {
			expect(onUpload).toHaveBeenCalled();
		});
	});
});
```

### Integration Testing

```tsx
// Test user flows
it('complete document upload flow', async () => {
	render(<App />);

	// Upload document
	const file = createPDFFile();
	uploadFile(file);

	// Verify editor loads
	await waitFor(() => {
		expect(screen.getByTestId('editor')).toBeInTheDocument();
	});
});
```

## Performance Optimization

### 1. Code Splitting

```tsx
// Lazy load heavy components
const Editor = lazy(() => import('@firmachain/firma-sign-documents'));

// Use with Suspense
<Suspense fallback={<Loading />}>
	<Editor />
</Suspense>;
```

### 2. Memoization

```tsx
// Memoize expensive calculations
const expensiveValue = useMemo(() => computeExpensiveValue(data), [data]);

// Memoize callbacks
const handleClick = useCallback(() => doSomething(id), [id]);

// Memoize components
const MemoizedComponent = memo(Component);
```

### 3. Virtual Scrolling

```tsx
// For long lists
import { VirtualList } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
	count: items.length,
	getScrollElement: () => parentRef.current,
	estimateSize: () => 50,
});
```

## Debugging

### 1. React DevTools

- Install React Developer Tools browser extension
- Inspect component tree and props
- Profile performance
- Track re-renders

### 2. Console Debugging

```tsx
// Debug state changes
useEffect(() => {
	console.log('State changed:', state);
}, [state]);

// Debug props
console.log('Component props:', props);
```

### 3. VS Code Debugging

```json
// .vscode/launch.json
{
	"version": "0.2.0",
	"configurations": [
		{
			"type": "chrome",
			"request": "launch",
			"name": "Debug Frontend",
			"url": "http://localhost:3000",
			"webRoot": "${workspaceFolder}/packages/frontend"
		}
	]
}
```

## Environment Configuration

### Environment Variables

```bash
# .env.development
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
VITE_DEBUG=true

# .env.production
VITE_API_URL=https://api.firma-sign.com
VITE_WS_URL=wss://api.firma-sign.com
VITE_DEBUG=false
```

### Using Environment Variables

```tsx
// Access in code
const apiUrl = import.meta.env.VITE_API_URL;
const isDebug = import.meta.env.VITE_DEBUG === 'true';

// Type safety
interface ImportMetaEnv {
	readonly VITE_API_URL: string;
	readonly VITE_WS_URL: string;
	readonly VITE_DEBUG: string;
}
```

## Build & Deployment

### Production Build

```bash
# Build for production
pnpm build

# Output in dist/
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── favicon.ico
```

### Build Optimization

```typescript
// vite.config.ts
export default defineConfig({
	build: {
		// Code splitting
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['react', 'react-dom'],
					pdf: ['@firmachain/firma-sign-documents'],
				},
			},
		},
		// Minification
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true,
			},
		},
	},
});
```

### Deployment Options

1. **Static Hosting**
   - Netlify, Vercel, GitHub Pages
   - Upload dist/ folder

2. **Docker**

   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY dist/ /usr/share/nginx/html/
   ```

3. **CDN**
   - CloudFront, Cloudflare
   - Cache static assets

## Common Issues & Solutions

### Issue: Vite HMR not working

**Solution**:

```typescript
// vite.config.ts
server: {
  watch: {
    usePolling: true, // For Docker/WSL
  },
}
```

### Issue: TypeScript errors in IDE

**Solution**:

```bash
# Restart TS server in VS Code
Cmd+Shift+P -> "TypeScript: Restart TS Server"
```

### Issue: Tailwind classes not working

**Solution**:

```typescript
// Ensure content paths are correct
// tailwind.config.ts
content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'];
```

### Issue: Build fails with memory error

**Solution**:

```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

## Best Practices

1. **Code Organization**
   - One component per file
   - Group related components
   - Extract reusable logic to hooks

2. **TypeScript**
   - Use strict mode
   - Define all prop types
   - Avoid `any` type

3. **Performance**
   - Minimize re-renders
   - Use lazy loading
   - Optimize bundle size

4. **Testing**
   - Write tests for critical paths
   - Test user interactions
   - Mock external dependencies

5. **Documentation**
   - Document complex logic
   - Keep README updated
   - Use JSDoc for utilities

## Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
