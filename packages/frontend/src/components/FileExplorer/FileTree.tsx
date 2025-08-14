import type React from 'react';
import { useState, useEffect } from 'react';
import type { FileItem } from './types';
import FolderNode from './FolderNode';
import FileNode from './FileNode';

interface FileTreeProps {
	files: FileItem[];
	expandedFolders: string[];
	selectedFiles: string[];
	onToggleFolder: (id: string) => void;
	onSelectFile: (id: string, multiSelect: boolean) => void;
	onFileDoubleClick: (file: FileItem) => void;
	onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
	onRename: (id: string, newName: string) => void;
	renamingId: string | null;
	onStartRename: (id: string) => void;
	onCancelRename: () => void;
	onMoveItem?: (itemId: string, targetFolderId: string | null) => void;
}

const FileTree: React.FC<FileTreeProps> = ({
	files,
	expandedFolders,
	selectedFiles,
	onToggleFolder,
	onSelectFile,
	onFileDoubleClick,
	onContextMenu,
	onRename,
	renamingId,
	onStartRename,
	onCancelRename,
	onMoveItem,
}) => {
	const [isDragOver, setIsDragOver] = useState(false);
	const [, setDragCounter] = useState(0);

	// Add effect to reset drag state when drag ends globally
	useEffect(() => {
		const handleGlobalDragEnd = () => {
			setIsDragOver(false);
			setDragCounter(0);
		};

		// Listen for global dragend events to ensure cleanup
		document.addEventListener('dragend', handleGlobalDragEnd);
		
		return () => {
			document.removeEventListener('dragend', handleGlobalDragEnd);
		};
	}, []);

	const handleDragEnter = (e: React.DragEvent) => {
		if (onMoveItem) {
			e.preventDefault();
			e.stopPropagation();
			
			// Only count if this is the actual container, not bubbled from children
			if (e.target === e.currentTarget) {
				setDragCounter(prev => {
					const newCount = prev + 1;
					if (newCount === 1) {
						setIsDragOver(true);
					}
					return newCount;
				});
			}
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		if (onMoveItem) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
		}
	};

	const handleDragLeave = (e: React.DragEvent) => {
		if (onMoveItem) {
			e.stopPropagation();
			
			// Only count if this is the actual container leaving
			if (e.target === e.currentTarget) {
				setDragCounter(prev => {
					const newCount = Math.max(0, prev - 1);
					if (newCount === 0) {
						setIsDragOver(false);
					}
					return newCount;
				});
			}
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		
		// Reset drag state immediately
		setIsDragOver(false);
		setDragCounter(0);
		
		if (onMoveItem) {
			const draggedItemId = e.dataTransfer.getData('text/plain');
			if (draggedItemId) {
				// Only drop to root if we're dropping on the container itself, not on a child
				const target = e.target as HTMLElement;
				const currentTarget = e.currentTarget as HTMLElement;
				
				// Check if we're dropping on the container background (not on a child element)
				if (target === currentTarget || target.classList.contains('overflow-y-auto')) {
					onMoveItem(draggedItemId, null);
				}
			}
		}
	};

	return (
		<div 
			className={`flex-1 overflow-y-auto ${isDragOver ? 'bg-blue-900 bg-opacity-20' : ''}`}
			onDragEnter={handleDragEnter}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			{files.map((item) => {
				if (item.type === 'folder') {
					return (
						<FolderNode
							key={item.id}
							folder={item}
							level={0}
							isExpanded={expandedFolders.includes(item.id)}
							isSelected={selectedFiles.includes(item.id)}
							selectedFiles={selectedFiles}
							expandedFolders={expandedFolders}
							onToggle={onToggleFolder}
							onSelect={onSelectFile}
							onFileDoubleClick={onFileDoubleClick}
							onContextMenu={onContextMenu}
							onRename={onRename}
							renamingId={renamingId}
							onStartRename={onStartRename}
							onCancelRename={onCancelRename}
							onMoveItem={onMoveItem}
						/>
					);
				} else {
					return (
						<FileNode
							key={item.id}
							file={item}
							level={0}
							isSelected={selectedFiles.includes(item.id)}
							onSelect={onSelectFile}
							onDoubleClick={onFileDoubleClick}
							onContextMenu={onContextMenu}
							onRename={onRename}
							isRenaming={renamingId === item.id}
							onStartRename={() => onStartRename(item.id)}
							onCancelRename={onCancelRename}
							onMoveItem={onMoveItem}
						/>
					);
				}
			})}
			{files.length === 0 && (
				<div className="text-center text-gray-500 text-sm mt-4">No files found</div>
			)}
		</div>
	);
};

export default FileTree;