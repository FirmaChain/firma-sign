# Drag and Drop File Organization Feature

## Overview

The File Explorer now supports drag and drop functionality in **Manual mode**, allowing users to organize their files by dragging them into custom folders.

## How to Use

### 1. Enable Manual Mode

- Look for the "Organization Mode" section in the File Explorer header
- Click the "Manual" button to switch from Automatic to Manual mode
- The button will turn blue when active

### 2. Create Custom Folders

- In Manual mode, click the folder icon (📁+) in the File Explorer header
- Enter a name for your new folder
- The folder will be created at the root level

### 3. Organize Files with Drag and Drop

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

- You can also drag and drop folders into other folders
- This creates nested folder structures

### 4. Visual Feedback

- **Dragging**: The item being dragged becomes semi-transparent (50% opacity)
- **Valid Drop Target**: Folders highlight with a blue background when you can drop into them
- **Root Drop Zone**: The entire file tree area gets a light blue tint when dropping to root

## Technical Implementation

### Components Updated

1. **FileExplorer.tsx**: Passes the `moveItem` function to FileTree when in manual mode
2. **FileTree.tsx**: Handles root-level drops and propagates drag/drop events
3. **FileNode.tsx**: Implements draggable behavior for files
4. **FolderNode.tsx**: Implements both draggable behavior and drop target functionality
5. **useFileSystem.ts**: Contains the `moveItem` logic that updates the file structure

### Key Features

- **Persistence**: The manual folder structure is saved to localStorage
- **Path Updates**: File paths are automatically updated when moved
- **Nested Support**: Supports unlimited folder nesting
- **Visual Feedback**: Clear visual indicators for drag states
- **Root Level Support**: Files can be moved back to root level

### Data Flow

```
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

## Mode Comparison

### Manual Mode

- ✅ Custom folder creation
- ✅ Drag and drop organization
- ✅ Persistent folder structure
- ✅ Complete control over file organization
- New documents appear at root level

### Automatic Mode

- Files auto-organized by category
- No custom folders
- No drag and drop
- Categories: Uploaded, Signed, Templates, etc.

## Benefits

1. **Intuitive Organization**: Users can organize files exactly how they want
2. **Visual Feedback**: Clear indicators make it easy to see where files will be dropped
3. **Flexibility**: Move files between folders or back to root as needed
4. **Persistence**: Organization is remembered between sessions
5. **No Learning Curve**: Works like traditional file explorers users are familiar with
