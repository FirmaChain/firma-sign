// Import and configure PDF worker before anything else
import '../../pdf-worker';

import { useCallback, useLayoutEffect, useRef, forwardRef, type ComponentProps } from 'react';
import { Document, Page as ReactPdfPage } from 'react-pdf';
import { cn } from '../../utils/cn';
import { DocumentLayer } from './DocumentLayer';
import { EnhancedPalette } from './EnhancedPalette';
import { ComponentsPanel } from './ComponentsPanel';
import { FloatingPanel, PanelPosition, FloatingPanelPosition } from './FloatingPanel';
import { PanelManagerProvider, usePanelManager } from './PanelManager';
import { DocumentComponent, ViewMode, AssignedUser, ComponentType } from './types';
import { getViewModeFromString } from './utils/editorUtils';
import { useComponentManagement } from './hooks/useComponentManagement';
import { usePDFManagement } from './hooks/usePDFManagement';
import { LoadingComponent } from './Components/LoadingComponent';
import { ErrorComponent } from './Components/ErrorComponent';
import { ZoomBar } from './Components/ZoomBar';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// DocumentArea component with Tailwind styling
const DocumentArea = forwardRef<HTMLDivElement, ComponentProps<'div'>>(
	({ className, ...props }, ref) => (
		<div ref={ref} className={cn('relative w-full h-full', className)} {...props} />
	),
);

export interface EditorProps {
	viewMode?: string;
	preview?: boolean;
	hideActionBtn?: boolean;
	hideSave?: boolean;
	onEnableNext?: (enabled: boolean) => void;
	enableNext?: boolean;
	className?: string;
	fileUrl?: string;
	fileId?: string;
	contractId?: string;
	signers?: AssignedUser[];
	components?: DocumentComponent[];
	onComponentsChange?: (components: DocumentComponent[]) => void;
}

const EditorInner = forwardRef<HTMLDivElement, EditorProps>(
	(
		{
			viewMode = 'editor',
			preview: _preview = false,
			hideActionBtn: _hideActionBtn = false,
			hideSave: _hideSave = false,
			onEnableNext: _onEnableNext,
			enableNext: _enableNext = false,
			className,
			fileUrl,
			fileId,
			contractId: _contractId,
			signers = [],
			components = [],
			onComponentsChange,
			...props
		},
		ref,
	) => {
		const panelManager = usePanelManager();
		const curPageRef = useRef<HTMLDivElement>(null);

		// Use custom hooks for PDF and component management
		const pdfManager = usePDFManagement({ fileUrl, fileId, viewMode });
		const componentManager = useComponentManagement({
			initialComponents: components,
			selectedPage: pdfManager.selectedPage,
			onComponentsChange,
		});

		// Handle drag and drop for tool components
		const handleDragStart = useCallback((toolType: ComponentType, signer?: AssignedUser) => {
			console.log('Drag started for tool:', toolType, signer);
		}, []);

		const handleDragOver = useCallback((e: React.DragEvent) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';
		}, []);

		const handleDrop = useCallback(
			(e: React.DragEvent) => {
				e.preventDefault();

				try {
					const dragData = JSON.parse(e.dataTransfer.getData('text/plain')) as {
						toolType: ComponentType;
						signer?: AssignedUser;
					};
					const { toolType, signer } = dragData;

					// Find which page the drop occurred on
					const target = e.target as HTMLElement;
					const pageElement = target.closest('[data-page-number]');

					if (pageElement) {
						const pageNumber = parseInt(pageElement.getAttribute('data-page-number') || '1') - 1;
						const pageRect = pageElement.getBoundingClientRect();

						// Calculate position relative to the page
						const x = (e.clientX - pageRect.left) / pdfManager.renderScale;
						const y = (e.clientY - pageRect.top) / pdfManager.renderScale;

						// Create component at drop position
						componentManager.handleComponentDrop(toolType, { x, y }, pageNumber, signer);
					}
				} catch (error) {
					console.error('Error handling drop:', error);
				}
			},
			[componentManager, pdfManager.renderScale],
		);

		const editorViewMode = getViewModeFromString(viewMode);

		// Adjust panel positions only on first render
		useLayoutEffect(() => {
			const adjustPanelPositions = () => {
				if (pdfManager.$DocumentArea.current) {
					const containerRect = pdfManager.$DocumentArea.current.getBoundingClientRect();
					const containerWidth = containerRect.width;
					const containerHeight = containerRect.height;

					// Only adjust if we have reasonable dimensions
					if (containerWidth > 200 && containerHeight > 200) {
						panelManager.adjustPanelsToContainer(containerWidth, containerHeight);
					}
				}
			};

			// Adjust positions only after initial render
			const timeoutId = setTimeout(adjustPanelPositions, 300);

			return () => {
				clearTimeout(timeoutId);
			};
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []); // Empty dependency array - runs only once on mount

		// Panel management handlers
		const handleLeftPanelPositionChange = useCallback(
			(position: PanelPosition, floatingPosition?: FloatingPanelPosition) => {
				panelManager.updateLeftPanel({
					position,
					...(floatingPosition && { floatingPosition }),
				});
			},
			[panelManager],
		);

		const handleRightPanelPositionChange = useCallback(
			(position: PanelPosition, floatingPosition?: FloatingPanelPosition) => {
				panelManager.updateRightPanel({
					position,
					...(floatingPosition && { floatingPosition }),
				});
			},
			[panelManager],
		);

		const handleLeftPanelPinnedChange = useCallback(
			(pinned: boolean) => {
				panelManager.updateLeftPanel({ isPinned: pinned });
			},
			[panelManager],
		);

		const handleRightPanelPinnedChange = useCallback(
			(pinned: boolean) => {
				panelManager.updateRightPanel({ isPinned: pinned });
			},
			[panelManager],
		);

		const handleLeftPanelVisibilityChange = useCallback(
			(visible: boolean) => {
				panelManager.updateLeftPanel({ isVisible: visible });
			},
			[panelManager],
		);

		const handleRightPanelVisibilityChange = useCallback(
			(visible: boolean) => {
				panelManager.updateRightPanel({ isVisible: visible });
			},
			[panelManager],
		);

		if (!pdfManager.file) {
			return (
				<div className="h-full flex items-center justify-center bg-gray-50">
					<div className="text-gray-500">No PDF file provided</div>
				</div>
			);
		}

		// Get panel states
		const leftPanelState = panelManager.state.leftPanel;
		const rightPanelState = panelManager.state.rightPanel;

		return (
			<div ref={ref} className={cn('h-full relative', className)} {...props}>
				{/* Panel Toggle Buttons */}
				<div className="absolute top-4 left-4 z-50 flex gap-2">
					{!leftPanelState.isVisible && (
						<button
							onClick={panelManager.toggleLeftPanel}
							className="px-3 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 text-sm"
							title="Show Tools Panel"
						>
							🎨 Tools
						</button>
					)}
					{!rightPanelState.isVisible && (
						<button
							onClick={panelManager.toggleRightPanel}
							className="px-3 py-2 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 text-sm"
							title="Show Components Panel"
						>
							📝 Components
						</button>
					)}
					<button
						onClick={panelManager.resetPanels}
						className="px-3 py-2 bg-gray-500 text-white rounded-lg shadow-lg hover:bg-gray-600 text-sm"
						title="Reset Panel Layout"
					>
						🔄 Reset
					</button>
				</div>

				<Document
					file={pdfManager.file}
					onLoadSuccess={pdfManager.onDocumentLoadSuccess}
					onLoadError={pdfManager.onDocumentLoadError}
					onLoadProgress={pdfManager.onDocumentLoadProgress}
					loading={<LoadingComponent isLoading={pdfManager.isLoading} />}
					error={
						<ErrorComponent
							error={pdfManager.loadError || 'Failed to load PDF'}
							currentUrlIndex={0}
							totalUrls={1}
							onRetry={pdfManager.resetPDF}
						/>
					}
					className="h-full relative"
				>
					{/* Document Area Container */}
					<div className="w-full h-full">
						<DocumentArea
							ref={pdfManager.$DocumentArea}
							id="editor-document-area"
							className="w-full h-full"
							onDragOver={handleDragOver}
							onDrop={handleDrop}
						>
							{/* Ribbon Menu */}
							<div
								className={cn(
									'absolute top-0 left-0 w-full z-10',
									'flex items-center justify-center',
									'px-5 py-4',
								)}
							>
								<div className="bg-white rounded-lg shadow-lg p-2 border border-gray-200">
									<div className="text-sm text-gray-600">Ribbon Menu - {viewMode}</div>
								</div>
							</div>

							{/* Mobile page indicator */}
							<div
								className={cn(
									'absolute top-[2%] right-[4%] z-10',
									'md:hidden',
									'text-xs pt-1 px-2 pb-1 rounded-md',
									'bg-gray-800 text-white font-bold',
									'shadow-lg',
									'flex flex-col items-center justify-center',
								)}
								ref={curPageRef}
							>
								<div className="flex items-center">
									<span className="opacity-100">{pdfManager.currentVisible + 1}</span>
									<span className="opacity-50 mx-1">/</span>
									<span className="opacity-50">{pdfManager.numPages}</span>
								</div>
								{pdfManager.numPages > 1 && (
									<div className="text-xs opacity-75 mt-1">
										Place: P{pdfManager.selectedPage + 1}
									</div>
								)}
							</div>

							{/* Debug info for pages position */}
							{process.env.NODE_ENV === 'development' && pdfManager.pagesPosition.length > 0 && (
								<div className="absolute top-16 right-4 z-10 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
									Pages: {pdfManager.pagesPosition.length}
								</div>
							)}

							{/* Scrollable Document */}
							<div
								className="h-full overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
								ref={pdfManager.$Scrollbar}
							>
								{/* Centering container for document pages */}
								<div className="min-h-full flex flex-col items-center justify-center p-4">
									{/* Document Pages Container - adapts to content width */}
									<div className="flex flex-col items-center space-y-5 py-10">
										{Array.from({ length: pdfManager.numPages || 1 }, (_, i) => (
											<div
												key={i}
												className={cn(
													'relative flex-shrink-0',
													'border border-gray-400 shadow-lg',
													'bg-white select-none',
													'mt-12 first:mt-5',
												)}
												data-page-number={i + 1}
											>
												<ReactPdfPage
													pageNumber={i + 1}
													scale={pdfManager.renderScale}
													width={pdfManager.pdfPageDimensions?.width}
													height={pdfManager.pdfPageDimensions?.height}
													loading={
														<div className="w-full min-h-[600px] bg-gray-50 flex items-center justify-center">
															<div className="text-gray-400">Loading page {i + 1}...</div>
														</div>
													}
													error={
														<div className="w-full min-h-[600px] bg-gray-50 flex items-center justify-center">
															<div className="text-red-400">Error loading page {i + 1}</div>
														</div>
													}
													onLoadSuccess={(page: { height: number; width: number }) => {
														pdfManager.onVisible(i, true);
														pdfManager.handlePagePosition(i, {
															top: 0,
															height: page.height,
														});
													}}
													className="pdf-page block"
												/>

												{/* Document components layer */}
												<DocumentLayer
													pageNumber={i}
													components={componentManager.documentComponents}
													selectedComponentId={componentManager.selectedComponentId}
													hoveredComponentId={componentManager.hoveredComponentId}
													viewMode={editorViewMode}
													scale={pdfManager.renderScale}
													onComponentUpdate={componentManager.handleComponentUpdate}
													onComponentSelect={componentManager.handleComponentSelect}
													onComponentDelete={componentManager.handleComponentDelete}
													onComponentHover={componentManager.handleComponentHover}
													onStartDrag={componentManager.handleStartDrag}
													onStartResize={componentManager.handleStartResize}
												/>
											</div>
										))}
									</div>
								</div>
							</div>

							{/* Zoom Bar */}
							<ZoomBar
								displayScale={pdfManager.displayScale}
								onScaleChange={pdfManager.handleScaleChange}
								onFitWidth={pdfManager.handleFitWidth}
								onFitHeight={pdfManager.handleFitHeight}
							/>
						</DocumentArea>
					</div>
				</Document>

				{/* Floating Panels */}
				{/* Left Panel - Tools/Palette */}
				<FloatingPanel
					id="left-panel"
					title="Document Tools"
					position={leftPanelState.position}
					floatingPosition={leftPanelState.floatingPosition}
					isPinned={leftPanelState.isPinned}
					isVisible={leftPanelState.isVisible}
					onPositionChange={handleLeftPanelPositionChange}
					onPinnedChange={handleLeftPanelPinnedChange}
					onVisibilityChange={handleLeftPanelVisibilityChange}
					width={leftPanelState.width}
					height={leftPanelState.height}
					minWidth={260}
					minHeight={400}
					maxWidth={400}
					maxHeight={800}
				>
					{editorViewMode === ViewMode.EDITOR ? (
						<EnhancedPalette
							signers={signers}
							selectedTool={componentManager.selectedTool}
							onToolSelect={componentManager.handleToolSelect}
							onUserSelect={componentManager.handleUserSelect}
							onDragStart={handleDragStart}
							viewMode={editorViewMode}
							numPages={pdfManager.numPages}
							selectedPage={pdfManager.selectedPage}
							onPageSelect={pdfManager.setSelectedPage}
						/>
					) : (
						<div className="p-4 text-sm text-gray-500">
							{editorViewMode === ViewMode.FORM
								? 'Form mode - design tools not available'
								: 'Preview mode - tools not available'}
						</div>
					)}
				</FloatingPanel>

				{/* Right Panel - Components */}
				<FloatingPanel
					id="right-panel"
					title="Component Manager"
					position={rightPanelState.position}
					floatingPosition={rightPanelState.floatingPosition}
					isPinned={rightPanelState.isPinned}
					isVisible={rightPanelState.isVisible}
					onPositionChange={handleRightPanelPositionChange}
					onPinnedChange={handleRightPanelPinnedChange}
					onVisibilityChange={handleRightPanelVisibilityChange}
					width={rightPanelState.width}
					height={rightPanelState.height}
					minWidth={320}
					minHeight={400}
					maxWidth={600}
					maxHeight={800}
				>
					<ComponentsPanel
						components={componentManager.documentComponents}
						selectedComponentId={componentManager.selectedComponentId}
						viewMode={editorViewMode}
						numPages={pdfManager.numPages}
						pdfUrl={fileUrl}
						fileName={fileId ? `${fileId}.pdf` : undefined}
						onComponentSelect={componentManager.handleComponentSelect}
						onComponentUpdate={componentManager.handleComponentUpdate}
						onComponentDelete={componentManager.handleComponentDelete}
						onComponentsChange={(newComponents) => {
							// This will be handled by the componentManager hook
							onComponentsChange?.(newComponents);
						}}
					/>
				</FloatingPanel>

				{/* Mobile Status Bar */}
				<div className="md:hidden absolute bottom-0 left-0 right-0 z-40">
					<div className="h-12 bg-gray-50 border-t border-gray-200">
						<div className="flex items-center justify-between h-full px-4 text-sm text-gray-500">
							<span>
								{componentManager.documentComponents.length > 0
									? `${componentManager.documentComponents.length} component${
											componentManager.documentComponents.length !== 1 ? 's' : ''
										} added`
									: 'No components added'}
							</span>
							<div className="flex gap-2">
								<button
									onClick={panelManager.toggleLeftPanel}
									className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
								>
									Tools
								</button>
								<button
									onClick={panelManager.toggleRightPanel}
									className="px-2 py-1 bg-green-500 text-white rounded text-xs"
								>
									Components
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	},
);

EditorInner.displayName = 'EditorInner';

// Main Editor component wrapped with PanelManagerProvider
export const Editor = forwardRef<HTMLDivElement, EditorProps>((props, ref) => {
	return (
		<PanelManagerProvider>
			<EditorInner {...props} ref={ref} />
		</PanelManagerProvider>
	);
});

Editor.displayName = 'Editor';

export default Editor;
