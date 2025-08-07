# Firma-Sign Documents

## Overview

The `@firmachain/firma-sign-documents` package provides React components for handling PDF documents in the Firma-Sign system. It includes a powerful editor for placing signature fields, text, checkboxes, and other components on PDF documents.

## Installation

```bash
npm install @firmachain/firma-sign-documents
```

## Quick Start

```tsx
import { Editor } from '@firmachain/firma-sign-documents';

function App() {
	const handleExport = (data) => {
		console.log('Exported document:', data);
	};

	return <Editor mode="edit" onExport={handleExport} />;
}
```

## Features

- **PDF Rendering**: High-performance PDF rendering with pdf.js
- **Component Placement**: Drag-and-drop signature fields, text, checkboxes
- **Multi-Page Support**: Handle documents with multiple pages
- **Zoom Controls**: Zoom in/out for precise placement
- **Export System**: Export documents with placed components
- **Responsive Design**: Works on desktop and tablet devices
- **Accessibility**: Keyboard navigation and screen reader support

## Main Components

### Editor

The main editor component for document editing and viewing.

### Document Components

- SignatureComponent
- TextComponent
- CheckboxComponent
- DateComponent
- StampComponent
- And more...

### Supporting Components

- ComponentsPanel
- PanelManager
- ZoomBar
- ExportPanel

## Documentation

- [API Reference](./docs/API.md) - Detailed component APIs
- [Architecture](./docs/ARCHITECTURE.md) - Technical architecture
- [Development](./docs/DEVELOPMENT.md) - Development guide

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Dependencies

- React 18+
- pdf.js for PDF rendering
- react-pdf for React integration
- pdf-lib for PDF manipulation

## License

MIT
