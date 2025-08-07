# Component Documentation

## Overview

This document provides detailed documentation for all React components in the Firma-Sign frontend application.

## Core Components

### App Component

**Location**: `src/App.tsx`

**Purpose**: Root component that provides the application shell and layout structure.

**Props**: None

**Structure**:

```tsx
<App>
	<Header />
	<Main>
		<DocumentsModule />
	</Main>
</App>
```

**Key Features**:

- Responsive container layout
- Application header with branding
- Main content area with overflow handling

**Styling**:

- Uses Tailwind classes for responsive design
- White background with shadow for elevated look
- Flexbox layout for proper content sizing

---

### DocumentsModule Component

**Location**: `src/components/DocumentsModule.tsx`

**Purpose**: Main document management interface that coordinates PDF upload and editing.

**State**:

```typescript
- uploadedPDF: string | null        // Base64 encoded PDF data
- isUploadSectionVisible: boolean   // Toggle for upload UI visibility
```

**Key Methods**:

- `handlePDFUpload(pdfDataUrl: string)`: Processes uploaded PDF
- `handleClearPDF()`: Clears current PDF and resets state
- `toggleUploadSection()`: Shows/hides upload interface

**Features**:

1. **PDF Management**
   - Handles PDF upload state
   - Falls back to sample PDF if no upload
   - Manages document lifecycle

2. **UI Layout**
   - Collapsible upload section
   - Full-height editor area
   - Responsive toggle controls

3. **Integration**
   - Uses firma-sign-documents Editor component
   - Passes signers configuration
   - Manages document IDs

**Usage Example**:

```tsx
<DocumentsModule />
```

**Component Flow**:

```
User Upload → PDFUploader → Base64 Conversion → State Update
    → Editor Props → Document Display
```

---

### PDFUploader Component

**Location**: `src/components/PDFUploader.tsx`

**Purpose**: Provides drag-and-drop and click-to-upload interface for PDF files.

**Props**:

```typescript
interface PDFUploaderProps {
	onUpload: (pdfDataUrl: string) => void; // Callback for successful upload
	onClear: () => void; // Callback to clear upload
	hasUploadedFile: boolean; // Current upload status
}
```

**State**:

```typescript
- isDragging: boolean      // Drag state for visual feedback
- uploadError: string | null  // Error message display
- isProcessing: boolean    // Loading state during file processing
```

**Key Methods**:

1. **validateFile(file: File): string | null**
   - Validates file type (must be PDF)
   - Checks file size (max 10MB)
   - Returns error message or null

2. **processFile(file: File): void**
   - Validates file
   - Converts to base64 data URL
   - Handles errors gracefully

3. **Drag & Drop Handlers**
   - `handleDrop`: Processes dropped files
   - `handleDragOver`: Updates drag state
   - `handleDragLeave`: Resets drag state

**Features**:

1. **Upload Methods**
   - Drag and drop support
   - Click to browse files
   - Visual feedback for drag states

2. **Validation**
   - File type checking (PDF only)
   - File size limit (10MB)
   - Error message display

3. **UI States**
   - Default upload state
   - Dragging state (blue highlight)
   - Processing state (loading spinner)
   - Success state (green confirmation)
   - Error state (red error message)

**Error Handling**:

```typescript
// File type error
'Please select a valid PDF file.';

// File size error
'File size must be less than 10MB.';

// Read error
'Failed to read the file. Please try again.';

// Generic error
'An error occurred while processing the file.';
```

**Usage Example**:

```tsx
<PDFUploader
	onUpload={(dataUrl) => setUploadedPDF(dataUrl)}
	onClear={() => setUploadedPDF(null)}
	hasUploadedFile={!!uploadedPDF}
/>
```

---

## External Components

### Editor Component

**Source**: `@firmachain/firma-sign-documents`

**Purpose**: Main document editing interface with signature field placement.

**Props Used**:

```typescript
{
  signers: MemberInfo[]        // List of document signers
  components: Component[]      // Placed components on document
  viewMode: 'editor'          // Current view mode
  preview: boolean            // Preview mode flag
  hideActionBtn: boolean      // Show/hide action buttons
  hideSave: boolean          // Show/hide save button
  enableNext: boolean        // Enable next button
  fileUrl: string           // PDF data URL or path
  fileId: string           // Unique file identifier
  contractId: string       // Contract identifier
  className?: string       // Additional CSS classes
}
```

**Integration Points**:

- Receives PDF data from DocumentsModule
- Manages signature field placement
- Handles document export

---

## Component Patterns

### State Management Pattern

Components use local state with lifting where needed:

```tsx
// Parent component
const [sharedState, setSharedState] = useState();

// Pass down state and updater
<ChildComponent value={sharedState} onChange={setSharedState} />;
```

### Error Handling Pattern

Consistent error display across components:

```tsx
{
	error && (
		<div className="error-container">
			<Icon />
			<p>{error}</p>
		</div>
	);
}
```

### Loading State Pattern

Consistent loading indicators:

```tsx
{
	isLoading ? <LoadingSpinner /> : <Content />;
}
```

---

## Component Guidelines

### Creating New Components

1. **File Structure**

   ```
   src/components/
   └── ComponentName.tsx
   ```

2. **Component Template**

   ```tsx
   import type React from 'react';

   interface ComponentNameProps {
     // Props definition
   }

   const ComponentName: React.FC<ComponentNameProps> = (props) => {
     // Component logic
     return (
       // JSX
     );
   };

   export default ComponentName;
   ```

3. **TypeScript Requirements**
   - Define props interface
   - Use `React.FC` type
   - Type all state and callbacks

4. **Styling Approach**
   - Use Tailwind utility classes
   - Extract complex styles to CSS
   - Maintain responsive design

### Performance Considerations

1. **Memoization**

   ```tsx
   const MemoizedComponent = React.memo(Component);
   ```

2. **Callback Optimization**

   ```tsx
   const stableCallback = useCallback(() => {
   	// callback logic
   }, [dependencies]);
   ```

3. **Computed Values**
   ```tsx
   const computedValue = useMemo(() => {
   	// expensive computation
   }, [dependencies]);
   ```

### Accessibility Guidelines

1. **ARIA Labels**

   ```tsx
   <button aria-label="Upload PDF file">
   ```

2. **Keyboard Navigation**
   - Tab order management
   - Enter/Space key handling
   - Escape key for modals

3. **Screen Reader Support**
   - Descriptive text
   - Status announcements
   - Error descriptions

---

## Component Testing

### Unit Testing Strategy

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Component from './Component';

describe('Component', () => {
	it('renders correctly', () => {
		render(<Component />);
		expect(screen.getByText('Expected Text')).toBeInTheDocument();
	});

	it('handles user interaction', () => {
		const handleClick = vi.fn();
		render(<Component onClick={handleClick} />);
		fireEvent.click(screen.getByRole('button'));
		expect(handleClick).toHaveBeenCalled();
	});
});
```

### Integration Testing

Test component interactions and data flow:

```tsx
it('uploads and displays PDF', async () => {
	render(<DocumentsModule />);

	const file = new File(['pdf content'], 'test.pdf', {
		type: 'application/pdf',
	});

	const input = screen.getByLabelText('Upload PDF');
	fireEvent.change(input, { target: { files: [file] } });

	await waitFor(() => {
		expect(screen.getByText('PDF uploaded successfully!')).toBeInTheDocument();
	});
});
```

---

## Future Components (Planned)

### TransferList Component

- Display document transfers
- Show transfer status
- Enable transfer actions

### SignerManager Component

- Manage document signers
- Assign signature fields
- Track signing progress

### NotificationBar Component

- Display system notifications
- Show success/error messages
- Handle dismissal

### SettingsPanel Component

- User preferences
- Application settings
- Account management
