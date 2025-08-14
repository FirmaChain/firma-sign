# File Explorer Design Documentation

## Overview

A Remix IDE-inspired file explorer for the Firma-Sign frontend that provides efficient file browsing, searching, and management capabilities for uploaded documents.

## Layout Design

### Overall Application Layout

```
┌─────────────────────────────────────────────────────────┐
│                    Header (firma-sign)                   │
├─────────────┬───────────────────────────────────────────┤
│             │                                            │
│   Sidebar   │           Main Content Area                │
│    (250px)  │                                            │
│             │                                            │
│ ┌─────────┐ │  ┌──────────────────────────────────────┐ │
│ │File     │ │  │                                       │ │
│ │Explorer │ │  │      Document Editor/Viewer           │ │
│ │         │ │  │                                       │ │
│ │- Search │ │  │                                       │ │
│ │- Tree   │ │  │                                       │ │
│ │  View   │ │  │                                       │ │
│ │- Actions│ │  │                                       │ │
│ └─────────┘ │  └──────────────────────────────────────┘ │
└─────────────┴───────────────────────────────────────────┘
```

### File Explorer Component Structure

```
FileExplorer
├── Header Section
│   ├── Title ("Files")
│   └── Action Buttons (New, Upload, Refresh)
├── Search Bar
│   ├── Search Input
│   ├── Filter Options
│   └── Clear Button
├── File Tree
│   ├── Folders (Collapsible)
│   │   ├── Contracts
│   │   ├── Agreements
│   │   └── Templates
│   └── Files
│       ├── File Icon
│       ├── File Name
│       ├── File Size
│       └── Modified Date
└── Context Menu (Right-click)
    ├── Open
    ├── Rename
    ├── Download
    ├── Delete
    └── Properties
```

## Component Hierarchy

```typescript
<App>
  <div className="flex">
    <Sidebar>
      <FileExplorer>
        <FileExplorerHeader />
        <FileSearch />
        <FileTree>
          <FolderNode>
            <FileNode />
          </FolderNode>
        </FileTree>
        <ContextMenu />
      </FileExplorer>
    </Sidebar>
    <MainContent>
      <DocumentsModule />
    </MainContent>
  </div>
</App>
```

## Features

### 1. File Tree Structure

- **Hierarchical Display**: Show files and folders in a tree structure
- **Expand/Collapse**: Click folders to expand/collapse
- **Icons**: Different icons for file types (PDF, DOC, etc.)
- **Selection**: Single and multi-select support
- **Drag & Drop**: Reorganize files and folders

### 2. Search Functionality

- **Real-time Search**: Filter files as you type
- **Advanced Filters**:
  - By file type (PDF, DOCX, etc.)
  - By date range
  - By size
  - By status (signed, pending, draft)
- **Search History**: Recent searches
- **Highlighting**: Highlight matching text in results

### 3. File Operations

- **Create**: New folder creation
- **Upload**: Direct file upload or drag & drop
- **Open**: Double-click to open in editor
- **Rename**: Inline editing of file names
- **Delete**: Move to trash with confirmation
- **Download**: Export files locally
- **Move/Copy**: Between folders

### 4. Context Menu Actions

Right-click on files/folders to access:

- Open
- Open in New Tab
- Rename
- Delete
- Download
- Copy Path
- Properties (size, created, modified)

### 5. Visual Indicators

- **File Status**:
  - 🟢 Signed/Complete
  - 🟡 Pending
  - 🔵 Draft
  - 🔴 Expired
- **File Types**:
  - 📄 PDF
  - 📝 Document
  - 📁 Folder
  - 📋 Template

## User Interactions

### Basic Workflows

1. **Opening a File**
   - Single click: Select file
   - Double click: Open in editor
   - Right-click: Show context menu

2. **Searching Files**
   - Type in search bar
   - Results update in real-time
   - Click result to select
   - Clear search to show all

3. **Organizing Files**
   - Drag file to folder
   - Create new folder
   - Rename inline
   - Multi-select with Ctrl/Cmd

## Data Structure

```typescript
interface FileItem {
	id: string;
	name: string;
	type: 'file' | 'folder';
	path: string;
	size?: number;
	mimeType?: string;
	createdAt: Date;
	modifiedAt: Date;
	status?: 'draft' | 'pending' | 'signed' | 'expired';
	children?: FileItem[]; // For folders
}

interface FileExplorerState {
	files: FileItem[];
	selectedFiles: string[];
	expandedFolders: string[];
	searchQuery: string;
	sortBy: 'name' | 'date' | 'size';
	sortOrder: 'asc' | 'desc';
}
```

## Styling (Remix IDE Inspired)

### Color Scheme

```css
/* Dark Theme (like Remix) */
--sidebar-bg: #1e1e1e;
--sidebar-border: #3c3c3c;
--file-hover: #2a2d2e;
--file-selected: #094771;
--text-primary: #cccccc;
--text-secondary: #969696;
--icon-color: #c5c5c5;
--search-bg: #3c3c3c;

/* Light Theme Alternative */
--sidebar-bg: #f3f3f3;
--sidebar-border: #e0e0e0;
--file-hover: #e8e8e8;
--file-selected: #e0f2fe;
--text-primary: #333333;
--text-secondary: #666666;
```

### Layout Specifications

- **Sidebar Width**: 250px (resizable)
- **Min Width**: 200px
- **Max Width**: 400px
- **File Item Height**: 28px
- **Indent Per Level**: 20px
- **Icon Size**: 16px
- **Font Size**: 13px

## Implementation Plan

### Phase 1: Basic Structure

1. Create FileExplorer component
2. Implement file tree rendering
3. Add expand/collapse functionality
4. Basic file selection

### Phase 2: Search & Filter

1. Add search bar component
2. Implement real-time filtering
3. Add advanced filter options
4. Search highlighting

### Phase 3: File Operations

1. Context menu implementation
2. File CRUD operations
3. Drag & drop support
4. Multi-select actions

### Phase 4: Integration

1. Connect with backend API
2. Real-time updates
3. File upload/download
4. State management

### Phase 5: Polish

1. Animations and transitions
2. Keyboard shortcuts
3. Accessibility features
4. Performance optimization

## Keyboard Shortcuts

| Shortcut           | Action             |
| ------------------ | ------------------ |
| `Ctrl/Cmd + F`     | Focus search       |
| `Enter`            | Open selected file |
| `F2`               | Rename selected    |
| `Delete`           | Delete selected    |
| `Ctrl/Cmd + A`     | Select all         |
| `Ctrl/Cmd + Click` | Multi-select       |
| `Arrow Keys`       | Navigate tree      |
| `Space`            | Toggle folder      |

## Performance Considerations

1. **Virtual Scrolling**: For large file lists
2. **Lazy Loading**: Load folder contents on expand
3. **Debounced Search**: Delay search execution
4. **Memoization**: Cache rendered components
5. **Pagination**: For folders with many items

## Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader announcements
- Focus management
- High contrast mode support

## Mock Data Example

```typescript
const mockFiles: FileItem[] = [
	{
		id: '1',
		name: 'Contracts',
		type: 'folder',
		path: '/contracts',
		createdAt: new Date('2024-01-01'),
		modifiedAt: new Date('2024-01-15'),
		children: [
			{
				id: '2',
				name: 'Service Agreement.pdf',
				type: 'file',
				path: '/contracts/service-agreement.pdf',
				size: 2048000,
				mimeType: 'application/pdf',
				status: 'signed',
				createdAt: new Date('2024-01-10'),
				modifiedAt: new Date('2024-01-15'),
			},
			{
				id: '3',
				name: 'NDA.pdf',
				type: 'file',
				path: '/contracts/nda.pdf',
				size: 1024000,
				mimeType: 'application/pdf',
				status: 'pending',
				createdAt: new Date('2024-01-12'),
				modifiedAt: new Date('2024-01-12'),
			},
		],
	},
	{
		id: '4',
		name: 'Templates',
		type: 'folder',
		path: '/templates',
		createdAt: new Date('2024-01-01'),
		modifiedAt: new Date('2024-01-01'),
		children: [],
	},
];
```

## Integration Points

### With DocumentsModule

- File selection triggers document load
- Save operations update file tree
- Status changes reflect in file icons

### With Backend API

- GET `/api/files` - List files
- POST `/api/files` - Upload file
- PUT `/api/files/:id` - Update file
- DELETE `/api/files/:id` - Delete file
- GET `/api/files/:id/download` - Download file

### With State Management

- Global file state
- Selected file state
- Search/filter state
- User preferences

## Future Enhancements

1. **Version Control**: Show file history
2. **Collaboration**: Real-time updates for shared files
3. **Tags & Labels**: Categorize files
4. **Quick Actions**: Bulk operations toolbar
5. **File Preview**: Thumbnail previews on hover
6. **Recent Files**: Quick access section
7. **Favorites**: Pin frequently used files
8. **Trash Bin**: Recover deleted files
9. **File Comments**: Add notes to files
10. **Activity Log**: Track file changes

## Component File Structure

```
src/components/
├── FileExplorer/
│   ├── FileExplorer.tsx           # Main component
│   ├── FileExplorerHeader.tsx     # Header with actions
│   ├── FileSearch.tsx             # Search bar component
│   ├── FileTree.tsx               # Tree view component
│   ├── FileNode.tsx               # Individual file item
│   ├── FolderNode.tsx             # Folder with children
│   ├── ContextMenu.tsx            # Right-click menu
│   ├── FileExplorer.css           # Styles
│   ├── types.ts                   # TypeScript types
│   ├── utils.ts                   # Helper functions
│   └── hooks/
│       ├── useFileTree.ts         # Tree state management
│       ├── useFileSearch.ts       # Search logic
│       └── useFileOperations.ts   # CRUD operations
```

## Review Checklist

- [ ] Layout meets requirements
- [ ] Features are comprehensive
- [ ] User experience is intuitive
- [ ] Performance considerations addressed
- [ ] Accessibility requirements met
- [ ] Integration points defined
- [ ] Implementation plan is clear
- [ ] Styling matches Remix IDE aesthetic

---

**Next Steps**: After review and approval, proceed with implementation following the phases outlined above.
