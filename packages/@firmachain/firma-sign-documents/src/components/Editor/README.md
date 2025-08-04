# Editor Component

The Editor component is a comprehensive document editor that has been ported from the hereby-web project and converted to use Tailwind CSS for styling.

## Features

- **Multiple View Modes**: Support for editor, input, sign, preview, and viewer modes
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Tool Palette**: Interactive palette for adding various document elements
- **Zoom Control**: Built-in zoom functionality with preset scales
- **Document Navigation**: Page-based navigation and scrolling
- **Ribbon Menu**: Context-aware menu bar with mode-specific actions

## Components

### Editor (Main Component)

The main editor component that orchestrates all functionality.

**Props:**

- `viewMode`: 'editor' | 'input' | 'sign' | 'preview' | 'viewer'
- `preview`: boolean
- `hideActionBtn`: boolean
- `hideSave`: boolean
- `enableNext`: boolean
- `onEnableNext`: (enabled: boolean) => void
- `fileUrl`: string - URL of the PDF file to display
- `fileId`: string - File ID for the PDF document
- `contractId`: string - Contract ID for the document

### Page

Individual page renderer for PDF documents.

**Props:**

- `fileId`: string
- `page`: number
- `scale`: number
- `viewMode`: string
- `onVisible`: (page: number, visible: boolean) => void
- `onPosition`: (page: number, position: any) => void

### Palette

Tool palette for editor mode with various document tools.

**Props:**

- `signers`: MemberInfo[]

### ZoomBar

Zoom controls for document scaling.

**Props:**

- `scale`: number
- `onScaleChange`: (scale: number) => void
- `viewMode`: string

### RibbonMenu

Context-aware menu bar with actions.

**Props:**

- `contractName`: string
- `viewMode`: string
- `btnDisabled`: boolean
- `hideActionBtn`: boolean
- `hideSave`: boolean
- `enableNext`: boolean
- `onFinish`: () => void

## Usage

```tsx
import { Editor } from '@firma-sign/documents';

function App() {
	return (
		<Editor
			viewMode="editor"
			fileUrl="/wcoomd/uploads/2018/05/blank.pdf"
			fileId="doc-123"
			contractId="contract-456"
			onEnableNext={(enabled) => console.log('Next enabled:', enabled)}
		/>
	);
}
```

## Styling

The component uses Tailwind CSS for styling and includes:

- Responsive design with mobile-first approach
- Consistent spacing and typography
- Accessible color schemes
- Smooth transitions and animations

## Migration Notes

This component has been migrated from styled-components to Tailwind CSS while maintaining the same functionality and visual design. The component structure has been simplified and made more maintainable.

### Key Changes:

- Converted from styled-components to Tailwind CSS
- Simplified component structure
- Improved TypeScript types
- Enhanced accessibility
- Better responsive design
- Cleaner prop interfaces

## Dependencies

- `react-pdf`: For PDF rendering and manipulation
- `clsx`: For conditional class names
- `tailwind-merge`: For merging Tailwind classes
- React 18+ with hooks support

## PDF Integration

The component uses `react-pdf` to render PDF documents with the following features:

- **Document Loading**: Supports URLs and file objects with proper loading states
- **Page Rendering**: Individual page rendering with scaling and positioning
- **Error Handling**: Graceful error handling for failed PDF loads
- **Progress Tracking**: Loading progress indication
- **Responsive Scaling**: Automatic scaling based on container size
- **Canvas Overlays**: Support for interactive elements over PDF pages

### PDF Worker Configuration

Make sure to configure the PDF.js worker in your application:

```tsx
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
```
