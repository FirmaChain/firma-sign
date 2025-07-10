import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Document, Page as ReactPdfPage, pdfjs } from 'react-pdf';
import { cn } from '../../utils/cn';
import { SAMPLE_PDF_BASE64, tryPDFSources, makeCORSFriendly } from './pdf-utils';
import { DocumentLayer } from './DocumentLayer';
import { EnhancedPalette } from './EnhancedPalette';
import { ComponentsPanel } from './ComponentsPanel';
import { FloatingPanel, PanelPosition, FloatingPanelPosition } from './FloatingPanel';
import { PanelManagerProvider, usePanelManager } from './PanelManager';
import {
	DocumentComponent,
	ViewMode,
	ComponentType,
	AssignedUser,
	Position,
	Size,
	ResizeHandle,
} from './types';
import { TOOLS_INFO } from './constants';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// DocumentArea component with Tailwind styling
const DocumentArea = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
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

const EditorInner = React.forwardRef<HTMLDivElement, EditorProps>(
	(
		{
			viewMode = 'editor',
			preview = false,
			hideActionBtn = false,
			hideSave = false,
			onEnableNext,
			enableNext = false,
			className,
			fileUrl,
			fileId,
			contractId,
			signers = [],
			components = [],
			onComponentsChange,
			...props
		},
		ref,
	) => {
		const panelManager = usePanelManager();
		const [numPages, setNumPages] = useState(0);
		const [displayScale, setDisplayScale] = useState(1);
		const [renderRatio, setRenderRatio] = useState(1);
		const [currentVisible, setCurrentVisible] = useState(0);
		const [selectedPage, setSelectedPage] = useState(0); // Page to place new components on
		const [pagesPosition, setPagesPosition] = useState<any[]>([]);
		const [isLoading, setIsLoading] = useState(true);
		const [loadError, setLoadError] = useState<string | null>(null);
		const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
		const [fallbackUrls, setFallbackUrls] = useState<string[]>([]);

		// Document component state
		const [documentComponents, setDocumentComponents] = useState<DocumentComponent[]>(components);
		const [selectedComponentId, setSelectedComponentId] = useState<string>('');
		const [hoveredComponentId, setHoveredComponentId] = useState<string>('');
		const [selectedTool, setSelectedTool] = useState<ComponentType | null>(null);
		const [, setSelectedUser] = useState<AssignedUser | null>(null);

		const renderScale = useMemo(() => displayScale * renderRatio, [displayScale, renderRatio]);
		const editorViewMode = useMemo(() => {
			switch (viewMode) {
				case 'editor':
					return ViewMode.EDITOR;
				case 'input':
					return ViewMode.INPUT;
				case 'sign':
					return ViewMode.SIGN;
				case 'preview':
					return ViewMode.PREVIEW;
				case 'viewer':
					return ViewMode.VIEWER;
				default:
					return ViewMode.EDITOR;
			}
		}, [viewMode]);

		const curPageRef = useRef<HTMLDivElement>(null);
		const $DocumentArea = useRef<HTMLDivElement>(null);
		const $Scrollbar = useRef<any>(null);

		const onDocumentLoadSuccess = useCallback(
			(pdf: any) => {
				setNumPages(pdf.numPages);
				setIsLoading(false);
				setLoadError(null);

				// Calculate render ratio based on viewport
				pdf
					.getPage(1)
					.then((page: any) => {
						const vp = page.getViewport({ scale: displayScale });

						if ($DocumentArea.current) {
							let clientWidth = $DocumentArea.current.clientWidth;

							// Responsive width calculation
							if (clientWidth >= 2400) clientWidth -= clientWidth * 0.75;
							else if (clientWidth >= 1600) clientWidth -= clientWidth * 0.5;
							else if (clientWidth >= 800) clientWidth -= clientWidth * 0.25;
							else clientWidth -= clientWidth * 0.1;

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
			},
			[displayScale, viewMode],
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
			// Handle loading progress if needed
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

		// Component management functions
		const generateComponentId = useCallback(() => {
			return `component-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
		}, []);

		const handleToolSelect = useCallback(
			(tool: ComponentType) => {
				setSelectedTool(tool);
				setSelectedComponentId('');

				// If this tool doesn't need assignment, create it immediately
				const toolInfo = TOOLS_INFO[tool];
				if (!toolInfo.needsAssignment) {
					// Generate a better initial position that works well for multi-page documents
					const getInitialPosition = () => {
						const baseX = 50; // Start closer to left edge
						const baseY = 50; // Start closer to top edge
						const randomOffset = Math.floor(Math.random() * 100);
						return {
							x: baseX + randomOffset,
							y: baseY + randomOffset,
						};
					};

					const newComponent: DocumentComponent = {
						id: generateComponentId(),
						type: tool,
						pageNumber: selectedPage,
						position: getInitialPosition(),
						size: toolInfo.defaultSize,
						assigned: {
							email: 'system@editor.com',
							name: 'Drawing Tool',
							color: '#666666',
						}, // Default neutral assignment
						config: toolInfo.defaultConfig,
						created: Date.now(),
					};

					const updatedComponents = [...documentComponents, newComponent];
					setDocumentComponents(updatedComponents);
					onComponentsChange?.(updatedComponents);

					// Clear tool selection after creating neutral component
					setSelectedTool(null);
				}
			},
			[currentVisible, documentComponents, onComponentsChange, generateComponentId],
		);

		const handleUserSelect = useCallback(
			(user: AssignedUser) => {
				setSelectedUser(user);

				// If we have a selected tool that needs assignment, create a component
				if (selectedTool) {
					const toolInfo = TOOLS_INFO[selectedTool];

					// Only create if this tool needs assignment
					if (toolInfo.needsAssignment) {
						// Generate a better initial position that works well for multi-page documents
						const getInitialPosition = () => {
							const baseX = 50; // Start closer to left edge
							const baseY = 50; // Start closer to top edge
							const randomOffset = Math.floor(Math.random() * 100);
							return {
								x: baseX + randomOffset,
								y: baseY + randomOffset,
							};
						};

						const newComponent: DocumentComponent = {
							id: generateComponentId(),
							type: selectedTool,
							pageNumber: selectedPage,
							position: getInitialPosition(),
							size: toolInfo.defaultSize,
							assigned: user,
							config: toolInfo.defaultConfig,
							created: Date.now(),
						};

						const updatedComponents = [...documentComponents, newComponent];
						setDocumentComponents(updatedComponents);
						onComponentsChange?.(updatedComponents);

						// Clear selections
						setSelectedTool(null);
						setSelectedUser(null);
					}
				}
			},
			[selectedTool, currentVisible, documentComponents, onComponentsChange, generateComponentId],
		);

		const handleComponentUpdate = useCallback(
			(updatedComponent: DocumentComponent) => {
				const updatedComponents = documentComponents.map((comp) =>
					comp.id === updatedComponent.id ? updatedComponent : comp,
				);
				setDocumentComponents(updatedComponents);
				onComponentsChange?.(updatedComponents);
			},
			[documentComponents, onComponentsChange],
		);

		const handleComponentDelete = useCallback(
			(componentId: string) => {
				const updatedComponents = documentComponents.filter((comp) => comp.id !== componentId);
				setDocumentComponents(updatedComponents);
				onComponentsChange?.(updatedComponents);
				setSelectedComponentId('');
			},
			[documentComponents, onComponentsChange],
		);

		const handleComponentSelect = useCallback((componentId: string) => {
			setSelectedComponentId(componentId);
			setSelectedTool(null); // Clear tool selection when selecting a component
		}, []);

		const handleComponentHover = useCallback((componentId: string | undefined) => {
			setHoveredComponentId(componentId || '');
		}, []);

		// Keyboard event handler for component manipulation
		const handleKeyDown = useCallback(
			(e: KeyboardEvent) => {
				if (!selectedComponentId) return;

				const component = documentComponents.find((c) => c.id === selectedComponentId);
				if (!component) return;

				const moveDistance = e.shiftKey ? 10 : 1;
				let updatedComponent = { ...component };

				switch (e.key) {
					case 'ArrowUp':
						e.preventDefault();
						updatedComponent.position.y = Math.max(0, component.position.y - moveDistance);
						break;
					case 'ArrowDown':
						e.preventDefault();
						updatedComponent.position.y = component.position.y + moveDistance;
						break;
					case 'ArrowLeft':
						e.preventDefault();
						updatedComponent.position.x = Math.max(0, component.position.x - moveDistance);
						break;
					case 'ArrowRight':
						e.preventDefault();
						updatedComponent.position.x = component.position.x + moveDistance;
						break;
					case 'Delete':
					case 'Backspace':
						e.preventDefault();
						handleComponentDelete(selectedComponentId);
						return;
					case 'Escape':
						e.preventDefault();
						setSelectedComponentId('');
						return;
					default:
						return;
				}

				handleComponentUpdate(updatedComponent);
			},
			[selectedComponentId, documentComponents, handleComponentUpdate, handleComponentDelete],
		);

		const handleStartDrag = useCallback((componentId: string, _startPosition: Position) => {
			// Drag handling is now managed by DocumentComponent for better UX
			// This callback is kept for compatibility but doesn't need to do anything
			console.log('Drag started for component:', componentId);
		}, []);

		const handleStartResize = useCallback(
			(componentId: string, handle: ResizeHandle, startPosition: Position, startSize: Size) => {
				const component = documentComponents.find((c) => c.id === componentId);
				if (!component) return;

				const handleMouseMove = (e: MouseEvent) => {
					const deltaX = e.clientX - startPosition.x;
					const deltaY = e.clientY - startPosition.y;

					let newSize = { ...startSize };
					let newPosition = { ...component.position };

					switch (handle) {
						case ResizeHandle.TOP_LEFT:
							newSize.width = Math.max(20, startSize.width - deltaX);
							newSize.height = Math.max(20, startSize.height - deltaY);
							newPosition.x = component.position.x + deltaX;
							newPosition.y = component.position.y + deltaY;
							break;
						case ResizeHandle.TOP_RIGHT:
							newSize.width = Math.max(20, startSize.width + deltaX);
							newSize.height = Math.max(20, startSize.height - deltaY);
							newPosition.y = component.position.y + deltaY;
							break;
						case ResizeHandle.BOTTOM_LEFT:
							newSize.width = Math.max(20, startSize.width - deltaX);
							newSize.height = Math.max(20, startSize.height + deltaY);
							newPosition.x = component.position.x + deltaX;
							break;
						case ResizeHandle.BOTTOM_RIGHT:
							newSize.width = Math.max(20, startSize.width + deltaX);
							newSize.height = Math.max(20, startSize.height + deltaY);
							break;
						case ResizeHandle.TOP:
							newSize.height = Math.max(20, startSize.height - deltaY);
							newPosition.y = component.position.y + deltaY;
							break;
						case ResizeHandle.BOTTOM:
							newSize.height = Math.max(20, startSize.height + deltaY);
							break;
						case ResizeHandle.LEFT:
							newSize.width = Math.max(20, startSize.width - deltaX);
							newPosition.x = component.position.x + deltaX;
							break;
						case ResizeHandle.RIGHT:
							newSize.width = Math.max(20, startSize.width + deltaX);
							break;
					}

					const updatedComponent = {
						...component,
						size: newSize,
						position: newPosition,
					};

					handleComponentUpdate(updatedComponent);
				};

				const handleMouseUp = () => {
					document.removeEventListener('mousemove', handleMouseMove);
					document.removeEventListener('mouseup', handleMouseUp);
				};

				document.addEventListener('mousemove', handleMouseMove);
				document.addEventListener('mouseup', handleMouseUp);
			},
			[documentComponents, handleComponentUpdate],
		);

		// Initialize components from props only on mount
		useEffect(() => {
			setDocumentComponents(components);
		}, []); // Only run on mount

		// Handle prop updates when components array changes externally
		useEffect(() => {
			// Use a simple check to avoid infinite loops
			if (components.length !== documentComponents.length) {
				setDocumentComponents(components);
			}
		}, [components.length]);

		// Add keyboard event listener
		useEffect(() => {
			document.addEventListener('keydown', handleKeyDown);
			return () => {
				document.removeEventListener('keydown', handleKeyDown);
			};
		}, [handleKeyDown]);

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

		// Adjust panel positions only on first render
		useLayoutEffect(() => {
			const adjustPanelPositions = () => {
				if ($DocumentArea.current) {
					const containerRect = $DocumentArea.current.getBoundingClientRect();
					const containerWidth = containerRect.width;
					const containerHeight = containerRect.height;
					
					// Only adjust if we have reasonable dimensions
					if (containerWidth > 200 && containerHeight > 200) {
						panelManager.adjustPanelsToContainer(containerWidth, containerHeight);
					}
				}
			};

			// Adjust positions only after initial render
			const timeoutId = setTimeout(adjustPanelPositions, 100);

			return () => {
				clearTimeout(timeoutId);
			};
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

		const file = useMemo(() => {
			if (fallbackUrls.length > 0 && currentUrlIndex < fallbackUrls.length) {
				const currentUrl = fallbackUrls[currentUrlIndex];
				return {
					url: makeCORSFriendly(currentUrl),
					withCredentials: false, // Set to false for CORS
					httpHeaders: {
						'Cache-Control': 'no-cache, no-store, must-revalidate',
					},
				};
			}
			return null;
		}, [fallbackUrls, currentUrlIndex]);

		const LoadingComponent = () => (
			<div className="absolute inset-0 flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
					<div className="text-gray-600">{isLoading ? 'Loading PDF...' : 'PDF Loading...'}</div>
				</div>
			</div>
		);

		const ErrorComponent = () => (
			<div className="absolute inset-0 flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="text-red-500 mb-2">⚠️</div>
					<div className="text-gray-600 mb-2">{loadError || 'Failed to load PDF'}</div>
					<div className="text-sm text-gray-500">
						Tried {currentUrlIndex + 1} of {fallbackUrls.length} sources
					</div>
					<button
						onClick={() => {
							setCurrentUrlIndex(0);
							setLoadError(null);
							setIsLoading(true);
						}}
						className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
					>
						Retry
					</button>
				</div>
			</div>
		);

		if (!file) {
			return (
				<div className="h-full flex items-center justify-center bg-gray-50">
					<div className="text-gray-500">No PDF file provided</div>
				</div>
			);
		}

		// Get panel states
		const leftPanelState = panelManager.state.leftPanel;
		const rightPanelState = panelManager.state.rightPanel;

		// Determine if panels are docked for layout adjustments

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
					file={file}
					onLoadSuccess={onDocumentLoadSuccess}
					onLoadError={onDocumentLoadError}
					onLoadProgress={onDocumentLoadProgress}
					loading={<LoadingComponent />}
					error={<ErrorComponent />}
					className="h-full relative"
				>
					{/* Document Area Container */}
					<div className="w-full h-full">
						<DocumentArea ref={$DocumentArea} id="editor-document-area" className="w-full h-full">
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
									<span className="opacity-100">{currentVisible + 1}</span>
									<span className="opacity-50 mx-1">/</span>
									<span className="opacity-50">{numPages}</span>
								</div>
								{numPages > 1 && (
									<div className="text-xs opacity-75 mt-1">Place: P{selectedPage + 1}</div>
								)}
							</div>

							{/* Debug info for pages position */}
							{process.env.NODE_ENV === 'development' && pagesPosition.length > 0 && (
								<div className="absolute top-16 right-4 z-10 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
									Pages: {pagesPosition.length}
								</div>
							)}

							{/* Scrollable Document */}
							<div className="h-full overflow-auto" ref={$Scrollbar}>
								{/* Centering container for document pages */}
								<div className="min-h-full flex items-center justify-center p-4">
									<div className="max-w-4xl w-full">
										{/* Document Pages */}
										<div className="space-y-5 py-10">
											{Array.from({ length: numPages || 1 }, (_, i) => (
												<div
													key={i}
													className={cn(
														'relative block mx-auto',
														'border border-gray-400 shadow-lg',
														'bg-white select-none text-center',
														'mt-12 first:mt-5',
													)}
													data-page-number={i + 1}
												>
													<ReactPdfPage
														pageNumber={i + 1}
														scale={renderScale}
														loading={
															<div className="w-full aspect-[8.5/11] bg-gray-50 flex items-center justify-center">
																<div className="text-gray-400">Loading page {i + 1}...</div>
															</div>
														}
														error={
															<div className="w-full aspect-[8.5/11] bg-gray-50 flex items-center justify-center">
																<div className="text-red-400">Error loading page {i + 1}</div>
															</div>
														}
														onLoadSuccess={(page: any) => {
															onVisible(i, true);
															handlePagePosition(i, { top: 0, height: page.height });
														}}
														className="pdf-page"
													/>

													{/* Document components layer */}
													<DocumentLayer
														pageNumber={i}
														components={documentComponents}
														selectedComponentId={selectedComponentId}
														hoveredComponentId={hoveredComponentId}
														viewMode={editorViewMode}
														scale={renderScale} // Use render scale for proper positioning
														onComponentUpdate={handleComponentUpdate}
														onComponentSelect={handleComponentSelect}
														onComponentDelete={handleComponentDelete}
														onComponentHover={handleComponentHover}
														onStartDrag={handleStartDrag}
														onStartResize={handleStartResize}
													/>
												</div>
											))}
										</div>
									</div>
								</div>
							</div>

							{/* Zoom Bar */}
							<div className="absolute bottom-4 left-4 z-10">
								<div className="bg-white rounded-lg shadow-lg p-2 border border-gray-200">
									<div className="flex items-center gap-2 text-sm">
										<button
											onClick={() => handleScaleChange(displayScale * 0.9)}
											className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
										>
											-
										</button>
										<span className="px-2">{Math.round(displayScale * 100)}%</span>
										<button
											onClick={() => handleScaleChange(displayScale * 1.1)}
											className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
										>
											+
										</button>
									</div>
								</div>
							</div>
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
							selectedTool={selectedTool}
							onToolSelect={handleToolSelect}
							onUserSelect={handleUserSelect}
							viewMode={editorViewMode}
							numPages={numPages}
							selectedPage={selectedPage}
							onPageSelect={setSelectedPage}
						/>
					) : (
						<div className="p-4 text-sm text-gray-500">Viewer mode - tools not available</div>
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
						components={documentComponents}
						selectedComponentId={selectedComponentId}
						viewMode={editorViewMode}
						numPages={numPages}
						onComponentSelect={handleComponentSelect}
						onComponentUpdate={handleComponentUpdate}
						onComponentDelete={handleComponentDelete}
						onComponentsChange={(newComponents) => {
							setDocumentComponents(newComponents);
							onComponentsChange?.(newComponents);
						}}
					/>
				</FloatingPanel>

				{/* Mobile Status Bar */}
				<div className="md:hidden absolute bottom-0 left-0 right-0 z-40">
					<div className="h-12 bg-gray-50 border-t border-gray-200">
						<div className="flex items-center justify-between h-full px-4 text-sm text-gray-500">
							<span>
								{documentComponents.length > 0
									? `${documentComponents.length} component${documentComponents.length !== 1 ? 's' : ''} added`
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
export const Editor = React.forwardRef<HTMLDivElement, EditorProps>((props, ref) => {
	return (
		<PanelManagerProvider>
			<EditorInner {...props} ref={ref} />
		</PanelManagerProvider>
	);
});

Editor.displayName = 'Editor';

export default Editor;
