import type React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import FileExplorerHeader from './FileExplorerHeader';
import FileSearch from './FileSearch';
import FileTree from './FileTree';
import ContextMenu from './ContextMenu';
import { useFileTree } from './hooks/useFileTree';
import { useFileSearch } from './hooks/useFileSearch';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useDocumentsAPI } from './hooks/useDocumentsAPI';
import { useFileSystem, type OrganizationMode } from './hooks/useFileSystem';
import { sortFiles, findFileById } from './utils';
import { DocumentCategory } from '../../services/api';
import type { FileItem, ContextMenuItem, ContextMenuPosition } from './types';

interface FileExplorerProps {
	onFileSelect: (file: FileItem) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect }) => {
	// Organization mode state
	const [organizationMode, setOrganizationMode] = useState<OrganizationMode>(
		localStorage.getItem('fileExplorer_organizationMode') as OrganizationMode || 'automatic'
	);

	// Use file system hook for document management
	const {
		files: fileSystemFiles,
		loading: fileSystemLoading,
		error: fileSystemError,
		fetchDocuments: fetchFileSystemDocs,
		createFolder,
		moveItem,
		deleteFolder,
	} = useFileSystem({ mode: organizationMode });

	// Use API for document operations
	const {
		uploadDocument,
		deleteDocument: deleteDocumentAPI,
		renameDocument: renameDocumentAPI,
		downloadDocument,
		getDocumentData,
		searchDocuments: searchDocumentsAPI,
	} = useDocumentsAPI();

	// Combine loading and error states
	const loading = fileSystemLoading;
	const error = fileSystemError;

	const {
		files,
		setFiles,
		expandedFolders,
		selectedFiles,
		toggleFolder,
		selectFile,
		deleteFile,
		renameFile,
	} = useFileTree([]);

	const { searchQuery, filteredFiles, handleSearch, clearSearch } = useFileSearch(files);

	const [contextMenu, setContextMenu] = useState<{
		items: ContextMenuItem[];
		position: ContextMenuPosition;
	} | null>(null);

	const [renamingId, setRenamingId] = useState<string | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Sync documents from file system with local file tree
	useEffect(() => {
		setFiles(fileSystemFiles);
	}, [fileSystemFiles, setFiles]);

	// Save organization mode preference
	useEffect(() => {
		localStorage.setItem('fileExplorer_organizationMode', organizationMode);
	}, [organizationMode]);

	// Using default sort values for now
	const sortedFiles = sortFiles(filteredFiles, 'name', 'asc');

	const handleFileDoubleClick = useCallback(
		async (file: FileItem) => {
			if (file.type === 'file') {
				// Load document data if not already loaded
				if (!file.data && file.id) {
					try {
						const data = await getDocumentData(file.id);
						file.data = data;
					} catch (err) {
						console.error('Failed to load document:', err);
						return;
					}
				}
				onFileSelect(file);
			}
		},
		[onFileSelect, getDocumentData],
	);

	const handleContextMenu = useCallback(
		(e: React.MouseEvent, file: FileItem) => {
			e.preventDefault();
			e.stopPropagation();

			const items: ContextMenuItem[] = [
				{
					label: 'Open',
					icon: '📂',
					action: () => {
						if (file.type === 'file') {
							onFileSelect(file);
						} else {
							toggleFolder(file.id);
						}
					},
					disabled: false,
				},
				{
					label: 'Rename',
					icon: '✏️',
					action: () => setRenamingId(file.id),
				},
				{ divider: true },
				{
					label: 'Delete',
					icon: '🗑️',
					action: () => {
						if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
							// Handle folders differently - they only exist in the frontend
							if (file.type === 'folder') {
								// For folders, check if it's empty first
								if (file.children && file.children.length > 0) {
									alert('Cannot delete non-empty folder. Please delete or move all items inside first.');
									return;
								}
								// Delete folder locally only (no server call needed)
								deleteFolder(file.id);
							} else {
								// For files, delete from server and then locally
								void deleteDocumentAPI(file.id).then(() => {
									deleteFile(file.id);
								}).catch((err) => {
									console.error('Failed to delete document:', err);
									alert('Failed to delete document. Please try again.');
								});
							}
						}
					},
				},
			];

			if (file.type === 'file') {
				items.splice(2, 0, {
					label: 'Download',
					icon: '⬇️',
					action: () => {
						void downloadDocument(file.id).catch((err) => {
							console.error('Failed to download document:', err);
						});
					},
				});
			}

			setContextMenu({
				items,
				position: { x: e.clientX, y: e.clientY },
			});
		},
		[onFileSelect, toggleFolder, deleteFile, deleteFolder, deleteDocumentAPI, downloadDocument],
	);

	const handleNewFolder = useCallback(() => {
		if (organizationMode === 'automatic') {
			alert('Folders are automatically organized by document categories. Switch to Manual mode to create custom folders.');
			return;
		}

		const folderName = prompt('Enter folder name:');
		if (folderName && folderName.trim()) {
			// Determine parent folder based on selection
			let parentId = null;
			if (selectedFiles.length === 1) {
				const selected = findFileById(files, selectedFiles[0]);
				if (selected && selected.type === 'folder') {
					parentId = selected.id;
				}
			}
			createFolder(parentId, folderName.trim());
			// Clear selection after creating folder
			selectFile('', false);
		}
	}, [organizationMode, selectedFiles, files, createFolder, selectFile]);

	const handleUpload = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileUpload = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				// Validate file type
				if (!file.type || file.type !== 'application/pdf') {
					alert('Only PDF files are supported. Please select a PDF file.');
					if (fileInputRef.current) {
						fileInputRef.current.value = '';
					}
					return;
				}
				
				try {
					// Determine category based on selected folder
					let category = DocumentCategory.UPLOADED;
					if (selectedFiles.length === 1) {
						const selectedFolder = files.find(f => f.id === selectedFiles[0] && f.type === 'folder');
						if (selectedFolder) {
							// Extract category from folder ID (e.g., "folder-uploaded" -> "uploaded")
							const folderCategory = selectedFolder.id.replace('folder-', '');
							if (Object.values(DocumentCategory).includes(folderCategory as DocumentCategory)) {
								category = folderCategory as DocumentCategory;
							}
						}
					}

					// Upload to server
					await uploadDocument(file, category);
					
					// The documents list will be refreshed automatically by the API hook
				} catch (err) {
					console.error('Failed to upload file:', err);
					alert('Failed to upload file. Please try again.');
				}
			}
			// Reset input
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		},
		[selectedFiles, files, uploadDocument],
	);

	const handleRefresh = useCallback(() => {
		// Fetch fresh data from server
		void fetchFileSystemDocs();
	}, [fetchFileSystemDocs]);

	const handleDeleteSelected = useCallback(async () => {
		if (selectedFiles.length > 0) {
			const fileNames = selectedFiles
				.map(id => findFileById(files, id)?.name)
				.filter(Boolean)
				.join(', ');
			
			if (window.confirm(`Delete ${selectedFiles.length} item(s)?\n${fileNames}`)) {
				try {
					// Delete from server
					await Promise.all(selectedFiles.map(id => deleteDocumentAPI(id)));
					// Update local state
					selectedFiles.forEach(id => deleteFile(id));
				} catch (err) {
					console.error('Failed to delete documents:', err);
				}
			}
		}
	}, [selectedFiles, files, deleteFile, deleteDocumentAPI]);

	const handleRenameSelected = useCallback(() => {
		if (selectedFiles.length === 1) {
			setRenamingId(selectedFiles[0]);
		}
	}, [selectedFiles]);

	const handleFocusSearch = useCallback(() => {
		searchInputRef.current?.focus();
	}, []);

	// Setup keyboard shortcuts
	useKeyboardShortcuts({
		onSearch: handleFocusSearch,
		onDelete: () => {
			void handleDeleteSelected();
		},
		onRename: handleRenameSelected,
		onNewFolder: handleNewFolder,
		onUpload: handleUpload,
		onRefresh: handleRefresh,
	});

	return (
		<div className="h-full bg-gray-800 text-gray-200 flex flex-col">
			<FileExplorerHeader
				onNewFolder={handleNewFolder}
				onUpload={handleUpload}
				onRefresh={handleRefresh}
				organizationMode={organizationMode}
				onModeChange={setOrganizationMode}
			/>
			<FileSearch
				ref={searchInputRef}
				searchQuery={searchQuery}
				onSearch={(query) => {
					handleSearch(query);
					// Also search on server if query is provided
					if (query.trim()) {
						void searchDocumentsAPI(query).then(() => fetchFileSystemDocs());
					} else {
						// Refresh to show all documents when search is cleared
						void fetchFileSystemDocs();
					}
				}}
				onClear={() => {
					clearSearch();
					void fetchFileSystemDocs();
				}}
			/>
			{error && (
				<div className="px-3 py-2 bg-red-900 text-red-200 text-sm">
					{error}
				</div>
			)}
			{loading && (
				<div className="px-3 py-2 text-gray-400 text-sm text-center">
					Loading documents...
				</div>
			)}
			<FileTree
				files={sortedFiles}
				expandedFolders={expandedFolders}
				selectedFiles={selectedFiles}
				onToggleFolder={toggleFolder}
				onSelectFile={selectFile}
				onFileDoubleClick={(file) => {
					void handleFileDoubleClick(file);
				}}
				onContextMenu={handleContextMenu}
				onRename={(id, newName) => {
					void renameDocumentAPI(id, newName).then(() => {
						renameFile(id, newName);
					}).catch((err) => {
						console.error('Failed to rename document:', err);
					});
				}}
				renamingId={renamingId}
				onStartRename={setRenamingId}
				onCancelRename={() => setRenamingId(null)}
				onMoveItem={organizationMode === 'manual' ? moveItem : undefined}
			/>
			{contextMenu && (
				<ContextMenu
					items={contextMenu.items}
					position={contextMenu.position}
					onClose={() => setContextMenu(null)}
				/>
			)}
			<input
				ref={fileInputRef}
				type="file"
				accept=".pdf,application/pdf"
				onChange={(e) => void handleFileUpload(e)}
				className="hidden"
			/>
		</div>
	);
};

export default FileExplorer;