import type { FileItem } from './types';

export const searchFiles = (files: FileItem[], query: string): FileItem[] => {
	if (!query) return files;

	const lowerQuery = query.toLowerCase();
	const results: FileItem[] = [];

	const searchInFiles = (items: FileItem[]) => {
		for (const item of items) {
			const nameMatch = item.name.toLowerCase().includes(lowerQuery);

			if (item.type === 'folder') {
				if (nameMatch) {
					results.push(item);
				}
				if (item.children) {
					searchInFiles(item.children);
				}
			} else if (nameMatch) {
				results.push(item);
			}
		}
	};

	searchInFiles(files);
	return results;
};

export const sortFiles = (
	files: FileItem[],
	sortBy: 'name' | 'date' | 'size',
	sortOrder: 'asc' | 'desc',
): FileItem[] => {
	const sorted = [...files].sort((a, b) => {
		// Folders always come first
		if (a.type === 'folder' && b.type === 'file') return -1;
		if (a.type === 'file' && b.type === 'folder') return 1;

		let comparison = 0;
		switch (sortBy) {
			case 'name':
				comparison = a.name.localeCompare(b.name);
				break;
			case 'date':
				comparison = a.modifiedAt.getTime() - b.modifiedAt.getTime();
				break;
			case 'size':
				comparison = (a.size || 0) - (b.size || 0);
				break;
		}

		return sortOrder === 'asc' ? comparison : -comparison;
	});

	// Recursively sort children
	return sorted.map((item) => ({
		...item,
		children: item.children ? sortFiles(item.children, sortBy, sortOrder) : undefined,
	}));
};

export const formatFileSize = (bytes?: number): string => {
	if (!bytes) return '--';
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export const formatDate = (date: Date): string => {
	return new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(date);
};

export const getFileIcon = (item: FileItem): string => {
	if (item.type === 'folder') {
		return '📁';
	}

	const extension = item.name.split('.').pop()?.toLowerCase();
	switch (extension) {
		case 'pdf':
			return '📄';
		case 'doc':
		case 'docx':
			return '📝';
		case 'xls':
		case 'xlsx':
			return '📊';
		case 'ppt':
		case 'pptx':
			return '📑';
		case 'png':
		case 'jpg':
		case 'jpeg':
		case 'gif':
			return '🖼️';
		default:
			return '📋';
	}
};

export const getStatusColor = (status?: string): string => {
	switch (status) {
		case 'signed':
			return 'text-green-500';
		case 'pending':
			return 'text-yellow-500';
		case 'draft':
			return 'text-blue-500';
		case 'expired':
			return 'text-red-500';
		default:
			return 'text-gray-500';
	}
};

export const findFileById = (files: FileItem[], id: string): FileItem | null => {
	for (const file of files) {
		if (file.id === id) return file;
		if (file.children) {
			const found = findFileById(file.children, id);
			if (found) return found;
		}
	}
	return null;
};

export const generateMockFiles = (): FileItem[] => {
	return [
		{
			id: '1',
			name: 'Contracts',
			type: 'folder',
			path: '/contracts',
			createdAt: new Date('2024-01-01'),
			modifiedAt: new Date('2024-01-15'),
			children: [
				{
					id: '2',
					name: 'Service Agreement.pdf',
					type: 'file',
					path: '/contracts/service-agreement.pdf',
					size: 2048000,
					mimeType: 'application/pdf',
					status: 'signed',
					createdAt: new Date('2024-01-10'),
					modifiedAt: new Date('2024-01-15'),
				},
				{
					id: '3',
					name: 'NDA.pdf',
					type: 'file',
					path: '/contracts/nda.pdf',
					size: 1024000,
					mimeType: 'application/pdf',
					status: 'pending',
					createdAt: new Date('2024-01-12'),
					modifiedAt: new Date('2024-01-12'),
				},
				{
					id: '4',
					name: 'Employment Contract.pdf',
					type: 'file',
					path: '/contracts/employment-contract.pdf',
					size: 1536000,
					mimeType: 'application/pdf',
					status: 'draft',
					createdAt: new Date('2024-01-14'),
					modifiedAt: new Date('2024-01-14'),
				},
			],
		},
		{
			id: '5',
			name: 'Agreements',
			type: 'folder',
			path: '/agreements',
			createdAt: new Date('2024-01-05'),
			modifiedAt: new Date('2024-01-20'),
			children: [
				{
					id: '6',
					name: 'Partnership Agreement.pdf',
					type: 'file',
					path: '/agreements/partnership-agreement.pdf',
					size: 3072000,
					mimeType: 'application/pdf',
					status: 'signed',
					createdAt: new Date('2024-01-18'),
					modifiedAt: new Date('2024-01-20'),
				},
				{
					id: '7',
					name: 'Vendor Agreement.pdf',
					type: 'file',
					path: '/agreements/vendor-agreement.pdf',
					size: 890000,
					mimeType: 'application/pdf',
					status: 'expired',
					createdAt: new Date('2023-12-01'),
					modifiedAt: new Date('2023-12-01'),
				},
			],
		},
		{
			id: '8',
			name: 'Templates',
			type: 'folder',
			path: '/templates',
			createdAt: new Date('2024-01-01'),
			modifiedAt: new Date('2024-01-01'),
			children: [
				{
					id: '9',
					name: 'Invoice Template.pdf',
					type: 'file',
					path: '/templates/invoice-template.pdf',
					size: 512000,
					mimeType: 'application/pdf',
					createdAt: new Date('2024-01-01'),
					modifiedAt: new Date('2024-01-01'),
				},
			],
		},
		{
			id: '10',
			name: 'Recent Documents',
			type: 'folder',
			path: '/recent',
			createdAt: new Date('2024-01-25'),
			modifiedAt: new Date('2024-01-25'),
			children: [],
		},
	];
};