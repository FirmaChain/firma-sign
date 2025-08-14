export interface FileItem {
	id: string;
	name: string;
	type: 'file' | 'folder';
	path: string;
	size?: number;
	mimeType?: string;
	createdAt: Date;
	modifiedAt: Date;
	status?: 'draft' | 'pending' | 'signed' | 'expired';
	children?: FileItem[];
	data?: string; // Base64 data for PDF files
}

export interface FileExplorerState {
	files: FileItem[];
	selectedFiles: string[];
	expandedFolders: string[];
	searchQuery: string;
	sortBy: 'name' | 'date' | 'size';
	sortOrder: 'asc' | 'desc';
}

export interface ContextMenuPosition {
	x: number;
	y: number;
}

export interface ContextMenuItem {
	label: string;
	icon?: React.ReactNode;
	action: () => void;
	divider?: boolean;
	disabled?: boolean;
}