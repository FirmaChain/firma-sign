import { useState, useEffect, useCallback } from 'react';
import { documentsAPI, DocumentCategory, DocumentStatus, DocumentMetadata, DocumentFilter } from '../../../services/api';
import type { FileItem } from '../types';

// Convert server document to FileItem format
const documentToFileItem = (doc: DocumentMetadata): FileItem => {
	return {
		id: doc.id,
		name: doc.originalName,
		type: 'file',
		path: `/${doc.category}/${doc.originalName}`,
		size: doc.size,
		mimeType: doc.mimeType,
		createdAt: new Date(doc.uploadedAt),
		modifiedAt: new Date(doc.uploadedAt),
		status: doc.status as FileItem['status'],
		data: undefined, // Will be loaded on demand
	};
};

// Group documents by category into folders
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
			folder.children.push(documentToFileItem(doc));
		}
	});

	// Filter out empty folders and return as array
	return Array.from(categoryFolders.values()).filter(
		folder => folder.children && folder.children.length > 0
	);
};

export const useDocumentsAPI = () => {
	const [documents, setDocuments] = useState<FileItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch documents from server
	const fetchDocuments = useCallback(async (filter?: DocumentFilter) => {
		setLoading(true);
		setError(null);
		try {
			const response = await documentsAPI.search(filter || {});
			if (response.success) {
				const organized = organizeDocumentsByCategory(response.documents);
				setDocuments(organized);
			}
		} catch (err) {
			// In development mode, use mock data if API fails
			const isDevelopment = import.meta.env.MODE === 'development';
			if (isDevelopment) {
				console.warn('API failed in development, using empty document list:', err);
				setDocuments([]);
				setError(null); // Don't show error in development
			} else {
				setError(err instanceof Error ? err.message : 'Failed to fetch documents');
				console.error('Error fetching documents:', err);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	// Upload a document
	const uploadDocument = useCallback(async (
		file: File,
		category: DocumentCategory = DocumentCategory.UPLOADED,
		metadata?: { transferId?: string; tags?: string[] }
	) => {
		setLoading(true);
		setError(null);
		try {
			const response = await documentsAPI.upload(file, category, metadata);
			if (response.success) {
				// Refresh documents list
				await fetchDocuments();
				return response.document;
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to upload document');
			console.error('Error uploading document:', err);
			throw err;
		} finally {
			setLoading(false);
		}
	}, [fetchDocuments]);

	// Delete a document
	const deleteDocument = useCallback(async (documentId: string, permanent = false) => {
		setLoading(true);
		setError(null);
		try {
			const response = await documentsAPI.deleteDocument(documentId, permanent);
			if (response.success) {
				// Refresh documents list
				await fetchDocuments();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to delete document');
			console.error('Error deleting document:', err);
			throw err;
		} finally {
			setLoading(false);
		}
	}, [fetchDocuments]);

	// Rename a document (by creating a new version with different name)
	const renameDocument = useCallback(async (documentId: string, newName: string) => {
		setLoading(true);
		setError(null);
		try {
			// Get the current document data
			const blob = await documentsAPI.getDocument(documentId);
			const file = new File([blob], newName, { type: blob.type });
			
			// Create a new version with the new name
			const response = await documentsAPI.createVersion(documentId, file, {
				renamedFrom: documentId,
				newName,
			});
			
			if (response.success) {
				// Refresh documents list
				await fetchDocuments();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to rename document');
			console.error('Error renaming document:', err);
			throw err;
		} finally {
			setLoading(false);
		}
	}, [fetchDocuments]);

	// Move document to different category
	const moveDocument = useCallback(async (documentId: string, category: DocumentCategory) => {
		setLoading(true);
		setError(null);
		try {
			const response = await documentsAPI.moveDocument(documentId, category);
			if (response.success) {
				// Refresh documents list
				await fetchDocuments();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to move document');
			console.error('Error moving document:', err);
			throw err;
		} finally {
			setLoading(false);
		}
	}, [fetchDocuments]);

	// Update document status
	const updateDocumentStatus = useCallback(async (documentId: string, status: DocumentStatus) => {
		setLoading(true);
		setError(null);
		try {
			const response = await documentsAPI.updateStatus(documentId, status);
			if (response.success) {
				// Refresh documents list
				await fetchDocuments();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update document status');
			console.error('Error updating document status:', err);
			throw err;
		} finally {
			setLoading(false);
		}
	}, [fetchDocuments]);

	// Download document
	const downloadDocument = useCallback(async (documentId: string) => {
		try {
			const blob = await documentsAPI.getDocument(documentId);
			const metadata = await documentsAPI.getMetadata(documentId);
			
			// Create a download link
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = metadata.metadata.originalName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to download document');
			console.error('Error downloading document:', err);
			throw err;
		}
	}, []);

	// Get document as base64 for viewing
	const getDocumentData = useCallback(async (documentId: string): Promise<string> => {
		try {
			const blob = await documentsAPI.getDocument(documentId);
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onloadend = () => resolve(reader.result as string);
				reader.onerror = reject;
				reader.readAsDataURL(blob);
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to get document data');
			console.error('Error getting document data:', err);
			throw err;
		}
	}, []);

	// Search documents
	const searchDocuments = useCallback(async (searchText: string) => {
		await fetchDocuments({ searchText });
	}, [fetchDocuments]);

	// Initial load
	useEffect(() => {
		void fetchDocuments();
	}, [fetchDocuments]);

	return {
		documents,
		loading,
		error,
		fetchDocuments,
		uploadDocument,
		deleteDocument,
		renameDocument,
		moveDocument,
		updateDocumentStatus,
		downloadDocument,
		getDocumentData,
		searchDocuments,
	};
};