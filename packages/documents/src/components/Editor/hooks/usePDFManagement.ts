/**
 * Custom hook for managing PDF document state
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SAMPLE_PDF_BASE64, tryPDFSources, makeCORSFriendly } from '../pdf-utils';
import '../../../pdf-worker';

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

	// Helper function to calculate optimal scale - prioritizes PDF aspect ratio over container fitting
	// NOTE: This approach maintains the original PDF file's aspect ratio by scaling based on width only.
	// The PDF height will be determined by its natural aspect ratio, which may require vertical scrolling.
	// This prevents distortion that would occur if we tried to fit both width AND height constraints.
	const calculateOptimalScale = useCallback(
		(pdfWidth: number, pdfHeight: number, containerWidth: number, containerHeight: number) => {
			// Use width-based scaling to maintain PDF aspect ratio
			// This ensures the PDF keeps its original proportions regardless of container shape
			const availableWidth = containerWidth * 0.85; // Leave some margin for UI elements

			// Scale based on width - let height be determined by PDF's aspect ratio
			const widthBasedScale = availableWidth / pdfWidth;

			// Apply reasonable bounds for usability
			const minScale = 0.25; // Minimum for readability
			const maxScale = 2.5; // Maximum to prevent excessive size

			const optimalScale = Math.max(minScale, Math.min(widthBasedScale, maxScale));

			// Calculate resulting height to check if scrolling will be needed
			const resultingHeight = pdfHeight * optimalScale;
			const availableHeight = containerHeight * 0.8;

			console.log('PDF scaling (aspect ratio preserved):', {
				pdfWidth,
				pdfHeight,
				pdfAspectRatio: (pdfWidth / pdfHeight).toFixed(2),
				containerWidth,
				containerHeight,
				containerAspectRatio: (containerWidth / containerHeight).toFixed(2),
				availableWidth,
				availableHeight,
				widthBasedScale: widthBasedScale.toFixed(3),
				optimalScale: optimalScale.toFixed(3),
				resultingWidth: (pdfWidth * optimalScale).toFixed(0),
				resultingHeight: resultingHeight.toFixed(0),
				willNeedVerticalScroll: resultingHeight > availableHeight,
			});

			return optimalScale;
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

						console.log('PDF loaded, maintaining original aspect ratio:', {
							originalWidth: vp.width,
							originalHeight: vp.height,
							aspectRatio: (vp.width / vp.height).toFixed(2),
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

	const handleFitWidth = useCallback(() => {
		if (!$DocumentArea.current || !pdfPageDimensions) return;

		const containerRect = $DocumentArea.current.getBoundingClientRect();
		const availableWidth = containerRect.width * 0.85; // Leave some margin for UI elements

		// Calculate the desired render scale to fit width
		const desiredRenderScale = availableWidth / pdfPageDimensions.width;

		// Since renderScale = displayScale * renderRatio, we need to solve for displayScale
		// displayScale = desiredRenderScale / renderRatio
		const fitWidthDisplayScale = desiredRenderScale / renderRatio;

		const minScale = 0.25;
		const maxScale = 2.5;
		const clampedScale = Math.max(minScale, Math.min(fitWidthDisplayScale, maxScale));

		setDisplayScale(clampedScale);
	}, [pdfPageDimensions, renderRatio]);

	const handleFitHeight = useCallback(() => {
		if (!$DocumentArea.current || !pdfPageDimensions) return;

		const containerRect = $DocumentArea.current.getBoundingClientRect();
		const availableHeight = containerRect.height * 0.8; // Leave some margin for UI elements

		// Calculate the desired render scale to fit height
		const desiredRenderScale = availableHeight / pdfPageDimensions.height;

		// Since renderScale = displayScale * renderRatio, we need to solve for displayScale
		// displayScale = desiredRenderScale / renderRatio
		const fitHeightDisplayScale = desiredRenderScale / renderRatio;

		const minScale = 0.25;
		const maxScale = 2.5;
		const clampedScale = Math.max(minScale, Math.min(fitHeightDisplayScale, maxScale));

		setDisplayScale(clampedScale);
	}, [pdfPageDimensions, renderRatio]);

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
		handleFitWidth,
		handleFitHeight,
	};
};
