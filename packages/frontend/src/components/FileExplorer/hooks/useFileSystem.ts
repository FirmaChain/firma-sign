import { useState, useCallback, useEffect } from 'react';
import type { FileItem } from '../types';
import { documentsAPI, DocumentCategory, DocumentMetadata } from '../../../services/api';

export type OrganizationMode = 'manual' | 'automatic';

interface UseFileSystemProps {
	mode: OrganizationMode;
}

// Convert server document to FileItem format
const documentToFileItem = (doc: DocumentMetadata, parentPath = '/'): FileItem => {
	return {
		id: doc.id,
		name: doc.originalName,
		type: 'file',
		path: `${parentPath}${doc.originalName}`,
		size: doc.size,
		mimeType: doc.mimeType,
		createdAt: new Date(doc.uploadedAt),
		modifiedAt: new Date(doc.uploadedAt),
		status: doc.status as FileItem['status'],
		data: undefined, // Will be loaded on demand
		metadata: {
			...doc.metadata,
			serverId: doc.id,
			category: doc.category,
			hash: doc.hash,
		}
	};
};

// Group documents by category into folders (automatic mode)
const organizeDocumentsByCategory = (documents: DocumentMetadata[]): FileItem[] => {
	const categoryFolders: Map<DocumentCategory, FileItem> = new Map();

	// Create folders for each category
	Object.values(DocumentCategory).forEach(category => {
		if (category !== DocumentCategory.DELETED) {
			categoryFolders.set(category, {
				id: `folder-${category}`,
				name: category.charAt(0).toUpperCase() + category.slice(1),
				type: 'folder',
				path: `/${category}`,
				createdAt: new Date(),
				modifiedAt: new Date(),
				children: [],
			});
		}
	});

	// Add documents to their respective category folders
	documents.forEach(doc => {
		const folder = categoryFolders.get(doc.category);
		if (folder && folder.children) {
			folder.children.push(documentToFileItem(doc, `/${doc.category}/`));
		}
	});

	// Filter out empty folders and return as array
	return Array.from(categoryFolders.values()).filter(
		folder => folder.children && folder.children.length > 0
	);
};

// Organize documents in a flat structure for manual organization
const organizeDocumentsManually = (documents: DocumentMetadata[], existingStructure?: FileItem[]): FileItem[] => {
	// Start with existing folder structure or empty
	const fileSystem: FileItem[] = existingStructure || [];
	
	// Create a map of existing documents for quick lookup
	const existingDocs = new Set<string>();
	const findExistingDocs = (items: FileItem[]) => {
		items.forEach(item => {
			if (item.type === 'file' && item.metadata && typeof item.metadata === 'object' && 'serverId' in item.metadata) {
				const metadata = item.metadata as Record<string, unknown>;
				const serverId = metadata.serverId;
				if (typeof serverId === 'string') {
					existingDocs.add(serverId);
				}
			}
			if (item.children) {
				findExistingDocs(item.children);
			}
		});
	};
	findExistingDocs(fileSystem);
	
	// Add new documents that aren't already in the structure
	const newDocs = documents.filter(doc => !existingDocs.has(doc.id));
	
	// Add new documents directly to root level
	if (newDocs.length > 0) {
		// Add new documents to root (not in any folder)
		newDocs.forEach(doc => {
			fileSystem.push(documentToFileItem(doc, '/'));
		});
	}
	
	// Remove documents that no longer exist on server
	const serverDocIds = new Set(documents.map(d => d.id));
	const removeDeletedDocs = (items: FileItem[]): FileItem[] => {
		return items.filter(item => {
			if (item.type === 'file' && item.metadata && typeof item.metadata === 'object' && 'serverId' in item.metadata) {
				const metadata = item.metadata as Record<string, unknown>;
				const serverId = metadata.serverId;
				if (typeof serverId === 'string') {
					return serverDocIds.has(serverId);
				}
			}
			if (item.children) {
				item.children = removeDeletedDocs(item.children);
			}
			return true;
		});
	};
	
	return removeDeletedDocs(fileSystem);
};

export const useFileSystem = ({ mode }: UseFileSystemProps) => {
	const [files, setFiles] = useState<FileItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	
	// Load saved folder structure from localStorage for manual mode
	const loadSavedStructure = useCallback((): FileItem[] | null => {
		if (mode === 'manual') {
			const saved = localStorage.getItem('fileExplorer_manualStructure');
			if (saved) {
				try {
					return JSON.parse(saved) as FileItem[] | null;
				} catch {
					return null;
				}
			}
		}
		return null;
	}, [mode]);
	
	// Save folder structure to localStorage for manual mode
	const saveStructure = useCallback((structure: FileItem[]) => {
		if (mode === 'manual') {
			localStorage.setItem('fileExplorer_manualStructure', JSON.stringify(structure));
		}
	}, [mode]);
	
	// Fetch documents from server and organize based on mode
	const fetchDocuments = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await documentsAPI.search({});
			if (response.success) {
				if (mode === 'automatic') {
					const organized = organizeDocumentsByCategory(response.documents);
					setFiles(organized);
				} else {
					const savedStructure = loadSavedStructure();
					const organized = organizeDocumentsManually(response.documents, savedStructure || undefined);
					setFiles(organized);
					saveStructure(organized);
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch documents');
			console.error('Error fetching documents:', err);
		} finally {
			setLoading(false);
		}
	}, [mode, loadSavedStructure, saveStructure]);
	
	// Create a new folder
	const createFolder = useCallback((parentId: string | null, folderName: string) => {
		const newFolder: FileItem = {
			id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			name: folderName,
			type: 'folder',
			path: parentId ? `${parentId}/${folderName}` : `/${folderName}`,
			createdAt: new Date(),
			modifiedAt: new Date(),
			children: [],
		};
		
		setFiles(prevFiles => {
			const updatedFiles = [...prevFiles];
			
			if (parentId) {
				// Add to parent folder
				const findAndAddToParent = (items: FileItem[]): boolean => {
					for (const item of items) {
						if (item.id === parentId && item.type === 'folder') {
							if (!item.children) item.children = [];
							// Check if a folder with the same name doesn't already exist
							const existingSameName = item.children.some(child => 
								child.type === 'folder' && child.name === newFolder.name
							);
							if (!existingSameName) {
								item.children.push(newFolder);
							}
							return true;
						}
						if (item.children && findAndAddToParent(item.children)) {
							return true;
						}
					}
					return false;
				};
				findAndAddToParent(updatedFiles);
			} else {
				// Add to root
				updatedFiles.push(newFolder);
			}
			
			if (mode === 'manual') {
				saveStructure(updatedFiles);
			}
			
			return updatedFiles;
		});
	}, [mode, saveStructure]);
	
	// Move a file or folder
	const moveItem = useCallback((itemId: string, targetFolderId: string | null) => {
		setFiles(prevFiles => {
			// Create a completely new structure to avoid any mutation issues
			const newStructure: FileItem[] = JSON.parse(JSON.stringify(prevFiles)) as FileItem[];
			
			let itemToMove: FileItem | null = null;
			
			// Find and remove the item from its current location
			const removeItem = (items: FileItem[]): boolean => {
				for (let i = 0; i < items.length; i++) {
					if (items[i].id === itemId) {
						itemToMove = items[i];
						items.splice(i, 1);
						return true;
					}
					if (items[i].children && removeItem(items[i].children)) {
						return true;
					}
				}
				return false;
			};
			
			// Remove the item
			if (!removeItem(newStructure)) {
				return prevFiles; // Item not found, return original
			}
			
			if (!itemToMove) {
				return prevFiles; // Item not found, return original
			}
			
			// Check if trying to move folder into itself
			if (targetFolderId && itemToMove.type === 'folder') {
				const isDescendant = (item: FileItem, targetId: string): boolean => {
					if (item.id === targetId) return true;
					if (item.children) {
						return item.children.some(child => isDescendant(child, targetId));
					}
					return false;
				};
				
				if (isDescendant(itemToMove, targetFolderId)) {
					return prevFiles; // Can't move folder into itself
				}
			}
			
			// Add item to new location
			if (targetFolderId) {
				// Add to specific folder
				const addToFolder = (items: FileItem[]): boolean => {
					for (const item of items) {
						if (item.id === targetFolderId && item.type === 'folder') {
							if (!item.children) item.children = [];
							item.children.push(itemToMove!);
							return true;
						}
						if (item.children && addToFolder(item.children)) {
							return true;
						}
					}
					return false;
				};
				
				if (!addToFolder(newStructure)) {
					return prevFiles; // Target folder not found
				}
			} else {
				// Add to root
				newStructure.push(itemToMove);
			}
			
			// Update path
			const updatePaths = (item: FileItem, parentPath: string) => {
				item.path = parentPath === '/' ? `/${item.name}` : `${parentPath}/${item.name}`;
				if (item.children) {
					item.children.forEach(child => updatePaths(child, item.path));
				}
			};
			
			const parentPath = targetFolderId ? 
				newStructure.find(item => item.id === targetFolderId)?.path || '/' : '/';
			updatePaths(itemToMove, parentPath);
			
			if (mode === 'manual') {
				saveStructure(newStructure);
			}
			
			return newStructure;
		});
	}, [mode, saveStructure]);
	
	// Delete a folder (only if empty)
	const deleteFolder = useCallback((folderId: string) => {
		setFiles(prevFiles => {
			const updatedFiles = [...prevFiles];
			
			const findAndDelete = (items: FileItem[]): boolean => {
				for (let i = 0; i < items.length; i++) {
					if (items[i].id === folderId && items[i].type === 'folder') {
						if (!items[i].children || items[i].children!.length === 0) {
							items.splice(i, 1);
							return true;
						} else {
							throw new Error('Cannot delete non-empty folder');
						}
					}
					if (items[i].children && findAndDelete(items[i].children)) {
						return true;
					}
				}
				return false;
			};
			
			try {
				findAndDelete(updatedFiles);
				if (mode === 'manual') {
					saveStructure(updatedFiles);
				}
			} catch (err) {
				console.error('Error deleting folder:', err);
				alert(err instanceof Error ? err.message : 'Failed to delete folder');
			}
			
			return updatedFiles;
		});
	}, [mode, saveStructure]);
	
	// Initial load
	useEffect(() => {
		void fetchDocuments();
	}, [fetchDocuments]);
	
	return {
		files,
		loading,
		error,
		fetchDocuments,
		createFolder,
		moveItem,
		deleteFolder,
		mode,
	};
};