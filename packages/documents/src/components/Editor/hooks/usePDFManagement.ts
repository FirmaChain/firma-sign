/**
 * Custom hook for managing PDF document state
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SAMPLE_PDF_BASE64, tryPDFSources, makeCORSFriendly } from '../pdf-utils';

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
	const [pdfPageDimensions, setPdfPageDimensions] = useState<{
		width: number;
		height: number;
	} | null>(null);

	const $DocumentArea = useRef<HTMLDivElement>(null);
	const $Scrollbar = useRef<any>(null);

	const renderScale = useMemo(() => displayScale * renderRatio, [displayScale, renderRatio]);

	// Helper function to calculate optimal scale
	const calculateOptimalScale = useCallback(
		(pdfWidth: number, pdfHeight: number, containerWidth: number, containerHeight: number) => {
			// Calculate available space (considering padding and max-width constraint)
			const maxWidth = Math.min(containerWidth * 0.9, 1024); // max-w-4xl ≈ 1024px, with some padding
			const maxHeight = containerHeight * 0.8; // Leave some space for UI elements

			// Calculate scale factors for both width and height
			const scaleX = maxWidth / pdfWidth;
			const scaleY = maxHeight / pdfHeight;

			// Use the smaller scale to ensure the PDF fits within the container while maintaining aspect ratio
			const optimalScale = Math.min(scaleX, scaleY, 2); // Cap at 2x to prevent oversized rendering

			// Ensure minimum scale for readability
			return Math.max(optimalScale, 0.3);
		},
		[],
	);

	// Effect to handle container resize
	useEffect(() => {
		if (!$DocumentArea.current || !pdfPageDimensions) return;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width: containerWidth, height: containerHeight } = entry.contentRect;

				const newScale = calculateOptimalScale(
					pdfPageDimensions.width,
					pdfPageDimensions.height,
					containerWidth,
					containerHeight,
				);

				console.log('Container resized, updating scale:', {
					containerWidth,
					containerHeight,
					pdfWidth: pdfPageDimensions.width,
					pdfHeight: pdfPageDimensions.height,
					newScale,
				});

				setRenderRatio(newScale);
			}
		});

		resizeObserver.observe($DocumentArea.current);

		return () => {
			resizeObserver.disconnect();
		};
	}, [pdfPageDimensions, calculateOptimalScale]);

	const onDocumentLoadSuccess = useCallback(
		(pdf: any) => {
			setNumPages(pdf.numPages);
			setIsLoading(false);
			setLoadError(null);

			// Calculate render ratio based on viewport and PDF dimensions
			pdf
				.getPage(1)
				.then((page: any) => {
					const vp = page.getViewport({ scale: 1 }); // Get viewport at scale 1 to get original dimensions
					setPdfPageDimensions({ width: vp.width, height: vp.height });

					if ($DocumentArea.current) {
						const containerRect = $DocumentArea.current.getBoundingClientRect();
						const finalScale = calculateOptimalScale(
							vp.width,
							vp.height,
							containerRect.width,
							containerRect.height,
						);

						console.log('PDF loaded, calculated scale:', {
							originalWidth: vp.width,
							originalHeight: vp.height,
							containerWidth: containerRect.width,
							containerHeight: containerRect.height,
							finalScale,
						});

						setRenderRatio(finalScale);
					} else {
						// Fallback if no container reference
						setRenderRatio(1);
					}
				})
				.catch((error: any) => {
					console.error('Error loading PDF page:', error);
					setLoadError('Failed to load PDF page');
				});
		},
		[calculateOptimalScale],
	);

	const onDocumentLoadError = useCallback(
		(error: any) => {
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
		},
		[currentUrlIndex, fallbackUrls.length],
	);

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
			setPdfPageDimensions(null); // Reset PDF dimensions when loading new file
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

	const resetPDF = useCallback(() => {
		setCurrentUrlIndex(0);
		setIsLoading(true);
		setLoadError(null);
		setNumPages(0);
		setPdfPageDimensions(null);
		setRenderRatio(1);
	}, []);

	return {
		// Document state
		numPages,
		isLoading,
		loadError,
		file,

		// Scale management
		displayScale,
		renderRatio,
		renderScale,

		// Page state
		currentVisible,
		selectedPage,
		setSelectedPage,
		pagesPosition,
		pdfPageDimensions,

		// Refs
		$DocumentArea,
		$Scrollbar,

		// Event handlers
		onDocumentLoadSuccess,
		onDocumentLoadError,
		onDocumentLoadProgress,
		handleScaleChange,
		handlePagePosition,
		onVisible,
		resetPDF,
	};
};
