import type React from 'react';
import { useState } from 'react';
import type { FileItem } from './types';
import FileNode from './FileNode';

interface FolderNodeProps {
	folder: FileItem;
	level: number;
	isExpanded: boolean;
	isSelected: boolean;
	selectedFiles: string[];
	expandedFolders: string[];
	onToggle: (id: string) => void;
	onSelect: (id: string, multiSelect: boolean) => void;
	onFileDoubleClick: (file: FileItem) => void;
	onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
	onRename: (id: string, newName: string) => void;
	renamingId: string | null;
	onStartRename: (id: string) => void;
	onCancelRename: () => void;
	onMoveItem?: (itemId: string, targetFolderId: string | null) => void;
}

const FolderNode: React.FC<FolderNodeProps> = ({
	folder,
	level,
	isExpanded,
	isSelected,
	selectedFiles,
	expandedFolders,
	onToggle,
	onSelect,
	onFileDoubleClick,
	onContextMenu,
	onRename,
	renamingId,
	onStartRename,
	onCancelRename,
	onMoveItem,
}) => {
	const [renameName, setRenameName] = useState(folder.name);
	const [isDragOver, setIsDragOver] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const isRenaming = renamingId === folder.id;

	const handleRenameSubmit = () => {
		if (renameName.trim() && renameName !== folder.name) {
			onRename(folder.id, renameName.trim());
		}
		onCancelRename();
	};

	const handleRenameKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleRenameSubmit();
		} else if (e.key === 'Escape') {
			setRenameName(folder.name);
			onCancelRename();
		}
	};

	const handleDragStart = (e: React.DragEvent) => {
		if (onMoveItem) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', folder.id);
			setIsDragging(true);
		}
	};

	const handleDragEnd = () => {
		setIsDragging(false);
	};

	const handleDragOver = (e: React.DragEvent) => {
		if (onMoveItem) {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
			setIsDragOver(true);
		}
	};

	const handleDragLeave = () => {
		setIsDragOver(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (onMoveItem) {
			const draggedItemId = e.dataTransfer.getData('text/plain');
			if (draggedItemId && draggedItemId !== folder.id) {
				onMoveItem(draggedItemId, folder.id);
			}
			setIsDragOver(false);
		}
	};

	return (
		<div>
			<div
				className={`flex items-center px-2 py-1 hover:bg-gray-700 cursor-pointer transition-colors ${
					isSelected ? 'bg-gray-700' : ''
				} ${isDragOver ? 'bg-blue-900 bg-opacity-50' : ''} ${isDragging ? 'opacity-50' : ''}`}
				draggable={!!onMoveItem}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				style={{ paddingLeft: `${level * 20 + 8}px` }}
				onClick={(e) => {
					e.stopPropagation();
					onSelect(folder.id, e.ctrlKey || e.metaKey);
					if (!isRenaming) {
						onToggle(folder.id);
					}
				}}
				onContextMenu={(e) => onContextMenu(e, folder)}
			>
				<svg
					className={`w-3 h-3 mr-1 text-gray-400 transition-transform ${
						isExpanded ? 'rotate-90' : ''
					}`}
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path
						fillRule="evenodd"
						d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
						clipRule="evenodd"
					/>
				</svg>
				<span className="mr-2 text-base">📁</span>
				{isRenaming ? (
					<input
						type="text"
						value={renameName}
						onChange={(e) => setRenameName(e.target.value)}
						onBlur={handleRenameSubmit}
						onKeyDown={handleRenameKeyDown}
						className="flex-1 bg-gray-700 text-gray-200 px-1 py-0 text-sm border border-blue-500 rounded outline-none"
						autoFocus
						onClick={(e) => e.stopPropagation()}
					/>
				) : (
					<span className="flex-1 text-sm text-gray-200 truncate">{folder.name}</span>
				)}
				{folder.children && folder.children.length > 0 && (
					<span className="text-xs text-gray-500 ml-2">{folder.children.length}</span>
				)}
			</div>

			{isExpanded && folder.children && (
				<div>
					{folder.children.map((child) => {
						if (child.type === 'folder') {
							return (
								<FolderNode
									key={child.id}
									folder={child}
									level={level + 1}
									isExpanded={expandedFolders.includes(child.id)}
									isSelected={selectedFiles.includes(child.id)}
									selectedFiles={selectedFiles}
									expandedFolders={expandedFolders}
									onToggle={onToggle}
									onSelect={onSelect}
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
									key={child.id}
									file={child}
									level={level + 1}
									isSelected={selectedFiles.includes(child.id)}
									onSelect={onSelect}
									onDoubleClick={onFileDoubleClick}
									onContextMenu={onContextMenu}
									onRename={onRename}
									isRenaming={renamingId === child.id}
									onStartRename={() => onStartRename(child.id)}
									onCancelRename={onCancelRename}
									onMoveItem={onMoveItem}
								/>
							);
						}
					})}
				</div>
			)}
		</div>
	);
};

export default FolderNode;