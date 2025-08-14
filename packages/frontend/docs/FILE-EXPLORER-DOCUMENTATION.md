# File Explorer Documentation

## Overview

A Remix IDE-inspired file explorer for the Firma-Sign frontend that provides efficient file browsing, searching, and management capabilities for uploaded documents. The File Explorer supports both automatic organization by category and manual organization with drag-and-drop functionality.

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
│   ├── Organization Mode Toggle (Manual/Automatic)
│   └── Action Buttons (New Folder, Upload, Refresh)
├── Search Bar
│   ├── Search Input
│   ├── Filter Options
│   └── Clear Button
├── File Tree
│   ├── Folders (Collapsible, Draggable in Manual mode)
│   │   ├── Custom Folders (Manual mode)
│   │   ├── Category Folders (Automatic mode)
│   │   └── Nested Folders Support
│   └── Files (Draggable in Manual mode)
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

## Organization Modes

### Manual Mode

- ✅ **Custom folder creation**: Create and name your own folders
- ✅ **Drag and drop organization**: Move files and folders freely
- ✅ **Persistent folder structure**: Saved to localStorage
- ✅ **Complete control**: Organize files exactly how you want
- ✅ **Nested folders**: Create unlimited folder hierarchies
- New documents appear at root level

### Automatic Mode

- Files auto-organized by category (Uploaded, Signed, Templates, etc.)
- No custom folder creation
- No drag and drop functionality
- Categories managed by system
- Simpler, hands-off approach

### Mode Switching

- Toggle between modes using the Organization Mode buttons in the header
- Each mode maintains its own expanded folder state
- Folder expansion states are preserved when switching modes
- All states persist across page refreshes

## Features

### 1. File Tree Structure

- **Hierarchical Display**: Show files and folders in a tree structure
- **Expand/Collapse**: Click folders to expand/collapse
- **Icons**: Different icons for file types (PDF, DOC, etc.)
- **Selection**: Single and multi-select support
- **Drag & Drop**: Reorganize files and folders (Manual mode only)
- **State Persistence**: Expanded folders remembered per mode

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

- **Create**: New folder creation (Manual mode)
- **Upload**: Direct file upload or drag & drop
- **Open**: Double-click to open in editor
- **Rename**: Inline editing of file names
- **Delete**: Move to trash with confirmation
- **Download**: Export files locally
- **Move/Copy**: Between folders (Manual mode)

### 4. Drag and Drop (Manual Mode)

#### Moving Files into Folders:

1. Click and hold on any file
2. Drag it over a folder - the folder will highlight in blue
3. Release to drop the file into that folder
4. The file will be moved immediately

#### Moving Files to Root Level:

1. Click and hold on any file (even if it's inside a folder)
2. Drag it to an empty area in the File Explorer
3. The background will turn slightly blue
4. Release to drop the file at the root level

#### Moving Folders:

- Drag and drop folders into other folders
- Creates nested folder structures
- Cannot drop a folder into itself or its descendants

#### Visual Feedback:

- **Dragging**: The item being dragged becomes semi-transparent (50% opacity)
- **Valid Drop Target**: Folders highlight with a blue background when you can drop into them
- **Root Drop Zone**: The entire file tree area gets a light blue tint when dropping to root

### 5. Context Menu Actions

Right-click on files/folders to access:

- Open
- Open in New Tab
- Rename
- Delete
- Download
- Copy Path
- Properties (size, created, modified)

### 6. Visual Indicators

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

3. **Organizing Files (Manual Mode)**
   - Drag file to folder
   - Create new folder with folder button
   - Rename inline
   - Multi-select with Ctrl/Cmd
   - Drag to empty space to move to root

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
	data?: string; // Base64 encoded file data
	metadata?: {
		serverId?: string;
		category?: string;
		hash?: string;
		[key: string]: any;
	};
}

interface FileExplorerState {
	files: FileItem[];
	selectedFiles: string[];
	expandedFolders: {
		manual: string[];
		automatic: string[];
	};
	searchQuery: string;
	sortBy: 'name' | 'date' | 'size';
	sortOrder: 'asc' | 'desc';
	organizationMode: 'manual' | 'automatic';
}
```

## Technical Implementation

### Components

1. **FileExplorer.tsx**: Main component that coordinates all file explorer functionality
2. **FileExplorerHeader.tsx**: Header with title, mode toggle, and action buttons
3. **FileSearch.tsx**: Search bar with filtering capabilities
4. **FileTree.tsx**: Tree view component handling root-level drops
5. **FileNode.tsx**: Individual file item (draggable in manual mode)
6. **FolderNode.tsx**: Folder with children (draggable and droppable in manual mode)
7. **ContextMenu.tsx**: Right-click context menu

### Hooks

1. **useFileTree.ts**: Tree state management, folder expansion persistence
2. **useFileSearch.ts**: Search and filter logic
3. **useFileSystem.ts**: File system operations, mode management, drag-drop logic
4. **useKeyboardShortcuts.ts**: Keyboard navigation and shortcuts
5. **useDocumentsAPI.ts**: Backend API integration

### State Management

#### Expanded Folders State

- Stored in localStorage as a single object: `fileExplorer_expandedFolders`
- Structure: `{ manual: string[], automatic: string[] }`
- Each mode maintains independent expanded state
- States persist across page refreshes

#### Organization Mode

- Stored in localStorage: `fileExplorer_organizationMode`
- Values: `'manual'` or `'automatic'`
- Defaults to `'automatic'`

#### Manual Folder Structure

- Stored in localStorage: `fileExplorer_manualStructure`
- Complete file tree structure for manual mode
- Automatically synced with server documents

### Data Flow

```
User Action → Component Event Handler → Hook Function → State Update
                                                      ↓
                                              localStorage save
                                                      ↓
                                              UI Re-render

Drag & Drop Flow:
User drags file → onDragStart sets item ID in dataTransfer
                ↓
User hovers over folder → onDragOver prevents default, shows visual feedback
                ↓
User drops → onDrop gets item ID, calls moveItem(itemId, targetFolderId)
                ↓
useFileSystem.moveItem → Updates file structure
                ↓
localStorage saves structure → UI re-renders with new structure
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
--drag-over: #1a73e8;

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

## Keyboard Shortcuts

| Shortcut           | Action              |
| ------------------ | ------------------- |
| `Ctrl/Cmd + F`     | Focus search        |
| `Enter`            | Open selected file  |
| `F2`               | Rename selected     |
| `Delete`           | Delete selected     |
| `Ctrl/Cmd + A`     | Select all          |
| `Ctrl/Cmd + Click` | Multi-select        |
| `Arrow Keys`       | Navigate tree       |
| `Space`            | Toggle folder       |
| `Ctrl/Cmd + N`     | New folder (Manual) |
| `Ctrl/Cmd + U`     | Upload file         |

## Performance Considerations

1. **Virtual Scrolling**: For large file lists
2. **Lazy Loading**: Load folder contents on expand
3. **Debounced Search**: Delay search execution
4. **Memoization**: Cache rendered components
5. **Pagination**: For folders with many items
6. **Efficient State Updates**: Minimize re-renders during drag operations

## Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader announcements
- Focus management
- High contrast mode support
- Drag and drop alternative via keyboard

## Integration Points

### With DocumentsModule

- File selection triggers document load
- Save operations update file tree
- Status changes reflect in file icons

### With Backend API

- GET `/api/documents/search` - List documents
- POST `/api/documents/upload` - Upload document
- PUT `/api/documents/:id` - Update document
- DELETE `/api/documents/:id` - Delete document
- GET `/api/documents/:id/download` - Download document

### With State Management

- Global file state
- Selected file state
- Search/filter state
- User preferences
- Organization mode preference

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
│   ├── types.ts                   # TypeScript types
│   ├── utils.ts                   # Helper functions
│   └── hooks/
│       ├── useFileTree.ts         # Tree state & persistence
│       ├── useFileSearch.ts       # Search logic
│       ├── useFileSystem.ts       # File operations & modes
│       ├── useKeyboardShortcuts.ts # Keyboard handling
│       └── useDocumentsAPI.ts     # Backend integration
```

## Future Enhancements

1. **Version Control**: Show file history and revisions
2. **Collaboration**: Real-time updates for shared files
3. **Tags & Labels**: Categorize files with custom tags
4. **Quick Actions**: Bulk operations toolbar
5. **File Preview**: Thumbnail previews on hover
6. **Recent Files**: Quick access section
7. **Favorites**: Pin frequently used files
8. **Trash Bin**: Recover deleted files
9. **File Comments**: Add notes to files
10. **Activity Log**: Track file changes
11. **Advanced Sorting**: Multiple sort criteria
12. **File Templates**: Quick document creation from templates
13. **Export/Import**: Backup and restore file organization
14. **Sharing**: Generate shareable links for files
15. **Notifications**: Alert on file changes

## Benefits

1. **Intuitive Organization**: Users can organize files exactly how they want
2. **Visual Feedback**: Clear indicators for all interactions
3. **Flexibility**: Switch between automatic and manual organization
4. **Persistence**: All preferences and organization remembered between sessions
5. **No Learning Curve**: Works like traditional file explorers users are familiar with
6. **Efficient Workflow**: Quick access to all document management features
7. **Scalability**: Handles large numbers of files efficiently

## Review Checklist

- [x] Layout meets requirements
- [x] Features are comprehensive
- [x] User experience is intuitive
- [x] Performance considerations addressed
- [x] Accessibility requirements met
- [x] Integration points defined
- [x] Implementation completed
- [x] Styling matches Remix IDE aesthetic
- [x] Drag and drop functionality working
- [x] State persistence implemented
- [x] Mode switching functional
- [x] Search and filtering operational

---

**Status**: Implemented and functional. The File Explorer is ready for production use with both automatic and manual organization modes fully operational.
