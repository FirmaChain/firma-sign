import React, { useEffect, useRef } from 'react';
import { Page as ReactPdfPage } from 'react-pdf';
import { cn } from '../../utils/cn';

interface PageProps {
	fileId?: string;
	page?: number;
	scale?: number;
	show?: boolean;
	viewMode?: string;
	onVisible?: (page: number, visible: boolean) => void;
	onPosition?: (page: number, position: { x?: number; y?: number; width?: number; height?: number; top?: number }) => void;
	onFinish?: () => void;
	previewEmail?: string;
	totalPage?: number;
	removeScrollGap?: boolean;
	className?: string;
}

export const Page = React.forwardRef<HTMLDivElement, PageProps>(
	(
		{
			fileId: _fileId,
			page = 0,
			totalPage: _totalPage = 1,
			scale = 1,
			show = true,
			viewMode = 'editor',
			onVisible,
			onPosition,
			onFinish: _onFinish,
			previewEmail: _previewEmail,
			removeScrollGap = false,
			className,
			...props
		},
		_ref,
	) => {
		const wrapperRef = useRef<HTMLDivElement>(null);

		// These will be calculated from the actual PDF page dimensions
		const [pageWidth, setPageWidth] = React.useState(595 * scale);
		const [pageHeight, setPageHeight] = React.useState(842 * scale);

		useEffect(() => {
			if (onPosition && wrapperRef.current) {
				const rect = wrapperRef.current.getBoundingClientRect();
				onPosition(page, { top: rect.top, height: rect.height });
			}
		}, [page, onPosition, scale]);

		useEffect(() => {
			if (onVisible) {
				// Intersection observer logic would go here
				onVisible(page, show);
			}
		}, [page, show, onVisible]);

		const handlePageLoadSuccess = (pdfPage: { getViewport: (params: { scale: number }) => { width: number; height: number } }) => {
			const viewport = pdfPage.getViewport({ scale });
			setPageWidth(viewport.width);
			setPageHeight(viewport.height);

			if (onPosition) {
				onPosition(page, { top: 0, height: viewport.height });
			}

			if (onVisible) {
				onVisible(page, true);
			}
		};

		return (
			<div
				ref={wrapperRef}
				className={cn(
					'relative block mx-auto my-0',
					'border border-gray-400 shadow-lg',
					'bg-white select-none text-center',
					'mt-12 first:mt-5',
					'last:mb-48',
					className,
				)}
				data-page-number={page + 1}
				{...props}
			>
				{/* React-PDF Page Component */}
				<ReactPdfPage
					pageNumber={page + 1}
					scale={scale}
					loading={
						<div className="w-full min-h-[600px] bg-gray-50 flex items-center justify-center text-gray-400">
							Loading page {page + 1}...
						</div>
					}
					error={
						<div className="w-full min-h-[600px] bg-gray-50 flex items-center justify-center text-red-400">
							Error loading page {page + 1}
						</div>
					}
					onLoadSuccess={handlePageLoadSuccess}
					className="pdf-page"
				/>

				{/* Canvas for interactive elements */}
				<div
					className={cn(
						'absolute top-0 left-0 select-none z-10 origin-top-left pointer-events-none',
						removeScrollGap ? 'scroll-mt-12' : 'scroll-mt-20',
					)}
					style={{
						width: pageWidth,
						height: pageHeight,
					}}
				>
					{/* Tool wrappers would go here */}
					{viewMode === 'editor' && (
						<div className="absolute inset-0 pointer-events-auto">{/* Editor tool overlays */}</div>
					)}

					{viewMode !== 'editor' && (
						<div className="absolute inset-0 pointer-events-auto">{/* Viewer tool overlays */}</div>
					)}
				</div>

				{/* Loading indicator */}
				{!show && (
					<div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
					</div>
				)}
			</div>
		);
	},
);

Page.displayName = 'Page';

export default Page;
