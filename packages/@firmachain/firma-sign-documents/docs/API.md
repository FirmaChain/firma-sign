# API Reference

## Components

### Editor

The main editor component for PDF document editing and viewing.

```tsx
interface EditorProps {
  mode?: 'edit' | 'view' | 'sign';
  onExport?: (data: ExportedDocument) => void;
  initialDocument?: PDFDocument;
  components?: ComponentData[];
  config?: EditorConfig;
}
```

**Props:**
- `mode` - Editor mode (default: 'edit')
- `onExport` - Callback when document is exported
- `initialDocument` - Initial PDF document to load
- `components` - Pre-placed components
- `config` - Editor configuration

**Example:**
```tsx
<Editor
  mode="edit"
  onExport={(data) => console.log(data)}
  config={{
    enableZoom: true,
    maxZoom: 200,
    minZoom: 50
  }}
/>
```

### SignatureComponent

Signature field component.

```tsx
interface SignatureComponentProps {
  id: string;
  position: Position;
  size: Size;
  page: number;
  data?: SignatureData;
  onUpdate?: (data: SignatureData) => void;
  isSelected?: boolean;
  isReadOnly?: boolean;
}
```

### TextComponent

Text input component.

```tsx
interface TextComponentProps {
  id: string;
  position: Position;
  size: Size;
  page: number;
  text?: string;
  style?: TextStyle;
  onUpdate?: (text: string) => void;
  isSelected?: boolean;
  isReadOnly?: boolean;
}
```

### CheckboxComponent

Checkbox component.

```tsx
interface CheckboxComponentProps {
  id: string;
  position: Position;
  size: Size;
  page: number;
  checked?: boolean;
  onUpdate?: (checked: boolean) => void;
  isSelected?: boolean;
  isReadOnly?: boolean;
}
```

## Hooks

### useComponentManagement

Manage component state and operations.

```tsx
const {
  components,
  selectedId,
  addComponent,
  updateComponent,
  deleteComponent,
  selectComponent,
  clearSelection
} = useComponentManagement();
```

### usePDFManagement

Handle PDF document operations.

```tsx
const {
  document,
  pages,
  currentPage,
  totalPages,
  loadDocument,
  goToPage,
  zoomIn,
  zoomOut
} = usePDFManagement();
```

### usePDFExport

Export PDF with components.

```tsx
const {
  exportPDF,
  isExporting,
  progress
} = usePDFExport();

// Usage
const data = await exportPDF(document, components);
```

## Types

### ComponentData

Base type for all components.

```typescript
interface ComponentData {
  id: string;
  type: ComponentType;
  page: number;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  data?: any;
  style?: ComponentStyle;
  metadata?: Record<string, any>;
}
```

### ComponentType

Available component types.

```typescript
type ComponentType = 
  | 'signature'
  | 'text'
  | 'checkbox'
  | 'date'
  | 'stamp'
  | 'line'
  | 'circle'
  | 'rectangle';
```

### ExportedDocument

Exported document structure.

```typescript
interface ExportedDocument {
  pdfData: Uint8Array;
  components: ComponentData[];
  metadata: {
    title: string;
    pageCount: number;
    exportDate: string;
    version: string;
  };
}
```

### EditorConfig

Editor configuration options.

```typescript
interface EditorConfig {
  enableZoom?: boolean;
  maxZoom?: number;
  minZoom?: number;
  enableKeyboardShortcuts?: boolean;
  enableDragDrop?: boolean;
  componentDefaults?: Partial<ComponentStyle>;
  theme?: 'light' | 'dark';
}
```

## Utility Functions

### loadPDFDocument

Load PDF from various sources.

```typescript
async function loadPDFDocument(
  source: string | Uint8Array | File
): Promise<PDFDocument>
```

### exportToPDF

Export document with components.

```typescript
async function exportToPDF(
  document: PDFDocument,
  components: ComponentData[]
): Promise<Uint8Array>
```

### validateComponent

Validate component data.

```typescript
function validateComponent(
  component: unknown
): component is ComponentData
```

## Events

### Editor Events

The Editor component emits various events:

```tsx
<Editor
  onDocumentLoad={(doc) => console.log('Document loaded')}
  onComponentAdd={(component) => console.log('Component added')}
  onComponentUpdate={(id, data) => console.log('Component updated')}
  onComponentDelete={(id) => console.log('Component deleted')}
  onPageChange={(page) => console.log('Page changed to', page)}
  onZoomChange={(zoom) => console.log('Zoom changed to', zoom)}
/>
```

## Constants

### Default Sizes

```typescript
export const DEFAULT_COMPONENT_SIZES = {
  signature: { width: 200, height: 80 },
  text: { width: 150, height: 30 },
  checkbox: { width: 20, height: 20 },
  date: { width: 120, height: 30 },
  stamp: { width: 150, height: 150 }
};
```

### Zoom Limits

```typescript
export const ZOOM_LIMITS = {
  MIN: 25,
  MAX: 400,
  DEFAULT: 100,
  STEP: 25
};
```

## Styling

### CSS Classes

The package exports CSS classes for customization:

```css
/* Component wrapper */
.firma-editor-component

/* Selected state */
.firma-editor-component--selected

/* Drag handle */
.firma-editor-component__handle

/* Component specific */
.firma-signature-component
.firma-text-component
.firma-checkbox-component
```

### Theme Customization

```tsx
<Editor
  theme={{
    primaryColor: '#007bff',
    borderColor: '#dee2e6',
    backgroundColor: '#ffffff',
    textColor: '#212529'
  }}
/>
```