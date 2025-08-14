import { useState, useCallback } from 'react';
import type { FileItem } from '../types';

export const useFileTree = (initialFiles: FileItem[]) => {
	const [files, setFiles] = useState<FileItem[]>(initialFiles);
	const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
	const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

	const toggleFolder = useCallback((folderId: string) => {
		setExpandedFolders((prev) =>
			prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId],
		);
	}, []);

	const selectFile = useCallback(
		(fileId: string, multiSelect = false) => {
			if (multiSelect) {
				setSelectedFiles((prev) =>
					prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId],
				);
			} else {
				setSelectedFiles([fileId]);
			}
		},
		[],
	);

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