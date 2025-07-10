/**
 * Custom hook for managing PDF document state
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SAMPLE_PDF_BASE64, tryPDFSources, makeCORSFriendly } from '../pdf-utils';
import { calculateResponsiveWidth } from '../utils/editorUtils';

interface UsePDFManagementProps {
	fileUrl?: string;
	fileId?: string;
	viewMode: string;
}

export const usePDFManagement = ({ fileUrl, fileId, viewMode }: UsePDFManagementProps) => {
	const [numPages, setNumPages] = useState(0);
	const [displayScale, setDisplayScale] = useState(1);
	const [renderRatio, setRenderRatio] = useState(1);
	const [currentVisible, setCurrentVisible] = useState(0);
	const [selectedPage, setSelectedPage] = useState(0);
	const [pagesPosition, setPagesPosition] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
	const [fallbackUrls, setFallbackUrls] = useState<string[]>([]);

	const $DocumentArea = useRef<HTMLDivElement>(null);
	const $Scrollbar = useRef<any>(null);

	const renderScale = useMemo(() => displayScale * renderRatio, [displayScale, renderRatio]);

	const onDocumentLoadSuccess = useCallback((pdf: any) => {
		setNumPages(pdf.numPages);
		setIsLoading(false);
		setLoadError(null);

		// Calculate render ratio based on viewport
		pdf
			.getPage(1)
			.then((page: any) => {
				const vp = page.getViewport({ scale: displayScale });

				if ($DocumentArea.current) {
					const clientWidth = calculateResponsiveWidth($DocumentArea.current.clientWidth);

					if (viewMode === 'editor') {
						setRenderRatio(1);
					} else {
						setRenderRatio(clientWidth / vp.width);
					}
				}
			})
			.catch((error: any) => {
				console.error('Error loading PDF page:', error);
				setLoadError('Failed to load PDF page');
			});
	}, [displayScale, viewMode]);

	const onDocumentLoadError = useCallback((error: any) => {
		console.error('Error loading PDF:', error);

		// Try next fallback URL if available
		if (currentUrlIndex < fallbackUrls.length - 1) {
			console.log(`Trying fallback URL ${currentUrlIndex + 1}/${fallbackUrls.length}`);
			setCurrentUrlIndex((prev) => prev + 1);
			setLoadError(null);
			return;
		}

		setLoadError('Failed to load PDF document');
		setIsLoading(false);
	}, [currentUrlIndex, fallbackUrls.length]);

	const onDocumentLoadProgress = useCallback((progress: any) => {
		console.log('Loading progress:', progress);
	}, []);

	const handleScaleChange = useCallback((scale: number) => {
		setDisplayScale(parseFloat(scale.toString()));
	}, []);

	const handlePagePosition = useCallback((page: number, top: any) => {
		setPagesPosition((prev) => {
			const newPos = [...prev];
			newPos[page] = top;
			return newPos;
		});
	}, []);

	const onVisible = useCallback((page: number, visible: boolean) => {
		if (visible) {
			setCurrentVisible(page);
		}
	}, []);

	// Initialize PDF URLs
	useEffect(() => {
		if (fileUrl || fileId) {
			const urls = tryPDFSources(fileUrl || SAMPLE_PDF_BASE64);
			setFallbackUrls(urls);
			setCurrentUrlIndex(0);
			setIsLoading(true);
			setLoadError(null);
			setNumPages(0);
		}
	}, [fileUrl, fileId]);

	const file = useMemo(() => {
		if (fallbackUrls.length > 0 && currentUrlIndex < fallbackUrls.length) {
			const currentUrl = fallbackUrls[currentUrlIndex];
			return {
				url: makeCORSFriendly(currentUrl),
				withCredentials: false,
				httpHeaders: {
					'Cache-Control': 'no-cache, no-store, must-revalidate',
				},
			};
		}
		return null;
	}, [fallbackUrls, currentUrlIndex]);

	return {
		// State
		numPages,
		displayScale,
		renderRatio,
		renderScale,
		currentVisible,
		selectedPage,
		pagesPosition,
		isLoading,
		loadError,
		file,
		// Refs
		$DocumentArea,
		$Scrollbar,
		// Handlers
		onDocumentLoadSuccess,
		onDocumentLoadError,
		onDocumentLoadProgress,
		handleScaleChange,
		handlePagePosition,
		onVisible,
		setSelectedPage,
		// Utils
		resetPDF: useCallback(() => {
			setCurrentUrlIndex(0);
			setLoadError(null);
			setIsLoading(true);
		}, []),
	};
};