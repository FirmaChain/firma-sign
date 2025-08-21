// FileItem interface - compatible with unified Document interface
export interface FileItem {
	// Core identification (compatible with DocumentMetadata)
	id: string;
	name: string; // originalName equivalent
	type: 'file' | 'folder';
	path: string;
	
	// Content metadata (compatible with DocumentMetadata)
	size?: number;
	mimeType?: string;
	hash?: string;
	
	// Temporal tracking (compatible with DocumentMetadata)
	createdAt: Date;
	modifiedAt: Date;
	
	// Status tracking (compatible with DocumentStatus)
	status?: 'draft' | 'pending' | 'in_progress' | 'signed' | 'completed' | 'rejected' | 'expired' | 'archived' | 'deleted';
	
	// Transfer context
	transferId?: string;
	
	// File explorer specific
	children?: FileItem[];
	data?: string; // Base64 data for PDF files
	
	// Document metadata compatibility
	uploadedBy?: string;
	signedBy?: string[];
	version?: number;
	tags?: string[];
	metadata?: Record<string, unknown>;
}

export interface FileExplorerState {
	files: FileItem[];
	selectedFiles: string[];
	expandedFolders: {
		manual: string[];
		automatic: string[];
	};
	searchQuery: string;
	sortBy: 'name' | 'date' | 'size' | 'status';
	sortOrder: 'asc' | 'desc';
	organizationMode: 'manual' | 'automatic';
	filter?: {
		status?: string[];
		tags?: string[];
		category?: string;
	};
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