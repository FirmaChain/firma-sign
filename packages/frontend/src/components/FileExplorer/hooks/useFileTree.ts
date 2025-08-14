import { useState, useCallback, useEffect } from 'react';
import type { FileItem } from '../types';
import type { OrganizationMode } from './useFileSystem';

const EXPANDED_FOLDERS_KEY = 'fileExplorer_expandedFolders';

// Type for the expanded folders storage structure
type ExpandedFoldersStorage = {
	manual: string[];
	automatic: string[];
};

export const useFileTree = (
	initialFiles: FileItem[],
	organizationMode: OrganizationMode = 'automatic',
) => {
	const [files, setFiles] = useState<FileItem[]>(initialFiles);

	// Load expanded folders from localStorage (single object with both modes)
	const loadExpandedFoldersStorage = (): ExpandedFoldersStorage => {
		try {
			const saved = localStorage.getItem(EXPANDED_FOLDERS_KEY);
			if (saved) {
				const parsed = JSON.parse(saved) as ExpandedFoldersStorage;
				// Ensure both keys exist

				return {
					manual: parsed.manual || [],
					automatic: parsed.automatic || [],
				};
			}
		} catch (error) {
			console.warn('Failed to load expanded folders from localStorage:', error);
		}
		return { manual: [], automatic: [] };
	};

	// Save expanded folders to localStorage (single object with both modes)
	const saveExpandedFoldersStorage = useCallback((storage: ExpandedFoldersStorage) => {
		try {
			localStorage.setItem(EXPANDED_FOLDERS_KEY, JSON.stringify(storage));
		} catch (error) {
			console.warn('Failed to save expanded folders to localStorage:', error);
		}
	}, []);

	// Initialize the storage state
	const [expandedFoldersStorage, setExpandedFoldersStorage] = useState<ExpandedFoldersStorage>(
		loadExpandedFoldersStorage,
	);

	// Current expanded folders based on the mode
	const expandedFolders = expandedFoldersStorage[organizationMode];

	// Update expanded folders for the current mode
	const updateExpandedFolders = useCallback(
		(updater: (prev: string[]) => string[]) => {
			setExpandedFoldersStorage((prevStorage) => {
				const newFolders = updater(prevStorage[organizationMode]);
				const newStorage = {
					...prevStorage,
					[organizationMode]: newFolders,
				};
				saveExpandedFoldersStorage(newStorage);
				return newStorage;
			});
		},
		[organizationMode, saveExpandedFoldersStorage],
	);
	const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
	const [isFilesInitialized, setIsFilesInitialized] = useState(false);

	// Helper function to collect all valid folder IDs from the file tree
	const getAllValidFolderIds = useCallback((items: FileItem[]): string[] => {
		const folderIds: string[] = [];

		const traverse = (fileItems: FileItem[]) => {
			fileItems.forEach((item) => {
				if (item.type === 'folder') {
					folderIds.push(item.id);
					if (item.children) {
						traverse(item.children);
					}
				}
			});
		};

		traverse(items);
		return folderIds;
	}, []);

	// Track when files are properly initialized
	useEffect(() => {
		if (files.length > 0 && !isFilesInitialized) {
			setIsFilesInitialized(true);
		}
	}, [files, isFilesInitialized]);

	// Clean up expanded folders when files change (remove invalid folder IDs)
	// Only run this after files are properly initialized to avoid clearing valid folders on initial load
	useEffect(() => {
		if (!isFilesInitialized) {
			return;
		}

		const validFolderIds = getAllValidFolderIds(files);

		// Clean up expanded folders for both modes
		setExpandedFoldersStorage((prevStorage) => {
			let newStorage = prevStorage;
			let updated = false;

			const organizationMode =
				(localStorage.getItem('fileExplorer_organizationMode') as OrganizationMode) || 'automatic';

			if (organizationMode === 'manual') {
				const cleanedManual = prevStorage.manual.filter((id) => validFolderIds.includes(id));
				if (cleanedManual.length !== prevStorage.manual.length) {
					newStorage = { ...newStorage, manual: cleanedManual };
					updated = true;
				}
			} else if (organizationMode === 'automatic') {
				const cleanedAutomatic = prevStorage.automatic.filter((id) => validFolderIds.includes(id));
				if (cleanedAutomatic.length !== prevStorage.automatic.length) {
					newStorage = { ...newStorage, automatic: cleanedAutomatic };
					updated = true;
				}
			}

			if (updated) {
				saveExpandedFoldersStorage(newStorage);
				return newStorage;
			}
			return prevStorage;
		});
	}, [files, getAllValidFolderIds, isFilesInitialized, saveExpandedFoldersStorage]);

	const toggleFolder = useCallback(
		(folderId: string) => {
			updateExpandedFolders((prev) => {
				const newExpanded = prev.includes(folderId)
					? prev.filter((id) => id !== folderId)
					: [...prev, folderId];
				return newExpanded;
			});
		},
		[updateExpandedFolders],
	);

	const selectFile = useCallback((fileId: string, multiSelect = false) => {
		if (multiSelect) {
			setSelectedFiles((prev) =>
				prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId],
			);
		} else {
			setSelectedFiles([fileId]);
		}
	}, []);

	const clearSelection = useCallback(() => {
		setSelectedFiles([]);
	}, []);

	const addFile = useCallback((parentId: string | null, newFile: FileItem) => {
		setFiles((prevFiles) => {
			if (!parentId) {
				return [...prevFiles, newFile];
			}

			const addToFolder = (items: FileItem[]): FileItem[] => {
				return items.map((item) => {
					if (item.id === parentId && item.type === 'folder') {
						return {
							...item,
							children: [...(item.children || []), newFile],
						};
					}
					if (item.children) {
						return {
							...item,
							children: addToFolder(item.children),
						};
					}
					return item;
				});
			};

			return addToFolder(prevFiles);
		});
	}, []);

	const deleteFile = useCallback((fileId: string) => {
		setFiles((prevFiles) => {
			const removeFile = (items: FileItem[]): FileItem[] => {
				return items
					.filter((item) => item.id !== fileId)
					.map((item) => {
						if (item.children) {
							return {
								...item,
								children: removeFile(item.children),
							};
						}
						return item;
					});
			};

			return removeFile(prevFiles);
		});
		setSelectedFiles((prev) => prev.filter((id) => id !== fileId));
	}, []);

	const renameFile = useCallback((fileId: string, newName: string) => {
		setFiles((prevFiles) => {
			const rename = (items: FileItem[]): FileItem[] => {
				return items.map((item) => {
					if (item.id === fileId) {
						return { ...item, name: newName };
					}
					if (item.children) {
						return {
							...item,
							children: rename(item.children),
						};
					}
					return item;
				});
			};

			return rename(prevFiles);
		});
	}, []);

	const moveFile = useCallback((fileId: string, targetFolderId: string | null) => {
		setFiles((prevFiles) => {
			let movedFile: FileItem | null = null;

			// First, find and remove the file
			const removeFile = (items: FileItem[]): FileItem[] => {
				return items
					.filter((item) => {
						if (item.id === fileId) {
							movedFile = item;
							return false;
						}
						return true;
					})
					.map((item) => {
						if (item.children) {
							return {
								...item,
								children: removeFile(item.children),
							};
						}
						return item;
					});
			};

			const filesWithoutMoved = removeFile(prevFiles);

			if (!movedFile) return prevFiles;

			// Then add it to the target location
			if (!targetFolderId) {
				return [...filesWithoutMoved, movedFile];
			}

			const addToFolder = (items: FileItem[]): FileItem[] => {
				return items.map((item) => {
					if (item.id === targetFolderId && item.type === 'folder') {
						return {
							...item,
							children: [...(item.children || []), movedFile!],
						};
					}
					if (item.children) {
						return {
							...item,
							children: addToFolder(item.children),
						};
					}
					return item;
				});
			};

			return addToFolder(filesWithoutMoved);
		});
	}, []);

	return {
		files,
		setFiles,
		expandedFolders,
		selectedFiles,
		toggleFolder,
		selectFile,
		clearSelection,
		addFile,
		deleteFile,
		renameFile,
		moveFile,
	};
};
