import type React from 'react';
import { useState } from 'react';
import type { FileItem } from './types';
import { getFileIcon, getStatusColor, formatFileSize } from './utils';

interface FileNodeProps {
	file: FileItem;
	level: number;
	isSelected: boolean;
	onSelect: (id: string, multiSelect: boolean) => void;
	onDoubleClick: (file: FileItem) => void;
	onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
	onRename: (id: string, newName: string) => void;
	isRenaming: boolean;
	onStartRename: () => void;
	onCancelRename: () => void;
	onMoveItem?: (itemId: string, targetFolderId: string | null) => void;
}

const FileNode: React.FC<FileNodeProps> = ({
	file,
	level,
	isSelected,
	onSelect,
	onDoubleClick,
	onContextMenu,
	onRename,
	isRenaming,
	onCancelRename,
	onMoveItem,
}) => {
	const [renameName, setRenameName] = useState(file.name);
	const [isDragging, setIsDragging] = useState(false);

	const handleRenameSubmit = () => {
		if (renameName.trim() && renameName !== file.name) {
			onRename(file.id, renameName.trim());
		}
		onCancelRename();
	};

	const handleRenameKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleRenameSubmit();
		} else if (e.key === 'Escape') {
			setRenameName(file.name);
			onCancelRename();
		}
	};

	const handleDragStart = (e: React.DragEvent) => {
		if (onMoveItem) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', file.id);
			setIsDragging(true);
		}
	};

	const handleDragEnd = () => {
		setIsDragging(false);
	};

	return (
		<div
			className={`flex items-center px-2 py-1 hover:bg-gray-700 cursor-pointer transition-colors ${
				isSelected ? 'bg-gray-700' : ''
			} ${isDragging ? 'opacity-50' : ''}`}
			draggable={!!onMoveItem}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			style={{ paddingLeft: `${level * 20 + 8}px` }}
			onClick={(e) => onSelect(file.id, e.ctrlKey || e.metaKey)}
			onDoubleClick={() => onDoubleClick(file)}
			onContextMenu={(e) => onContextMenu(e, file)}
		>
			<span className="mr-2 text-base">{getFileIcon(file)}</span>
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
				<>
					<span className="flex-1 text-sm text-gray-200 truncate">{file.name}</span>
					{file.status && (
						<span className={`ml-2 text-xs ${getStatusColor(file.status)}`}>
							● {file.status}
						</span>
					)}
					{file.size && (
						<span className="ml-2 text-xs text-gray-500">{formatFileSize(file.size)}</span>
					)}
				</>
			)}
		</div>
	);
};

export default FileNode;