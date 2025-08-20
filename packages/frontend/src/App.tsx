import type React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import DocumentsModule from './components/DocumentsModule';
import FileExplorer from './components/FileExplorer/FileExplorer';
import PeerExplorer from './components/PeerExplorer/PeerExplorer';
import AuthConnect from './components/AuthConnect';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { FileItem } from './components/FileExplorer/types';

const AppContent: React.FC = () => {
	const { isAuthenticated } = useAuth();
	const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px (w-64)
	const [isResizing, setIsResizing] = useState(false);
	const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
	const [rightPanelWidth, setRightPanelWidth] = useState(400); // Default 400px
	const [isRightPanelResizing, setIsRightPanelResizing] = useState(false);
	const rightPanelResizeRef = useRef<HTMLDivElement>(null);
	const resizeRef = useRef<HTMLDivElement>(null);

	const handleFileSelect = (file: FileItem) => {
		setSelectedFile(file);
	};

	// Load saved sidebar width from localStorage
	useEffect(() => {
		const savedWidth = localStorage.getItem('sidebarWidth');
		if (savedWidth) {
			const width = parseInt(savedWidth, 10);
			if (width >= 200 && width <= 600) {
				setSidebarWidth(width);
			}
		}

		const savedRightPanelWidth = localStorage.getItem('rightPanelWidth');
		if (savedRightPanelWidth) {
			const width = parseInt(savedRightPanelWidth, 10);
			if (width >= 300 && width <= 800) {
				setRightPanelWidth(width);
			}
		}
	}, []);

	// Save sidebar width to localStorage
	const saveSidebarWidth = useCallback((width: number) => {
		localStorage.setItem('sidebarWidth', width.toString());
	}, []);

	// Save right panel width to localStorage
	const saveRightPanelWidth = useCallback((width: number) => {
		localStorage.setItem('rightPanelWidth', width.toString());
	}, []);

	// Handle mouse down on resize handle
	const handleResizeStart = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsResizing(true);
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';

		// Prevent text selection during resize
		document.body.classList.add('select-none');
	}, []);

	// Handle mouse move during resize
	const handleResizeMove = useCallback(
		(e: MouseEvent) => {
			if (!isResizing) return;

			const newWidth = e.clientX;
			const minWidth = 200;
			const maxWidth = 600;

			if (newWidth >= minWidth && newWidth <= maxWidth) {
				setSidebarWidth(newWidth);
			}
		},
		[isResizing],
	);

	// Handle mouse up to end resize
	const handleResizeEnd = useCallback(() => {
		if (isResizing) {
			setIsResizing(false);
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
			document.body.classList.remove('select-none');
			saveSidebarWidth(sidebarWidth);
		}
		if (isRightPanelResizing) {
			setIsRightPanelResizing(false);
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
			document.body.classList.remove('select-none');
			saveRightPanelWidth(rightPanelWidth);
		}
	}, [
		isResizing,
		isRightPanelResizing,
		sidebarWidth,
		rightPanelWidth,
		saveSidebarWidth,
		saveRightPanelWidth,
	]);

	// Handle mouse down on right panel resize handle
	const handleRightPanelResizeStart = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsRightPanelResizing(true);
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';

		// Prevent text selection during resize
		document.body.classList.add('select-none');
	}, []);

	// Handle mouse move during right panel resize
	const handleRightPanelResizeMove = useCallback(
		(e: MouseEvent) => {
			if (!isRightPanelResizing) return;

			const newWidth = window.innerWidth - e.clientX;
			const minWidth = 300;
			const maxWidth = 800;

			if (newWidth >= minWidth && newWidth <= maxWidth) {
				setRightPanelWidth(newWidth);
			}
		},
		[isRightPanelResizing],
	);

	// Attach global mouse events for resize
	useEffect(() => {
		if (isResizing) {
			document.addEventListener('mousemove', handleResizeMove);
			document.addEventListener('mouseup', handleResizeEnd);

			return () => {
				document.removeEventListener('mousemove', handleResizeMove);
				document.removeEventListener('mouseup', handleResizeEnd);
			};
		}
		if (isRightPanelResizing) {
			document.addEventListener('mousemove', handleRightPanelResizeMove);
			document.addEventListener('mouseup', handleResizeEnd);

			return () => {
				document.removeEventListener('mousemove', handleRightPanelResizeMove);
				document.removeEventListener('mouseup', handleResizeEnd);
			};
		}
	}, [
		isResizing,
		isRightPanelResizing,
		handleResizeMove,
		handleRightPanelResizeMove,
		handleResizeEnd,
	]);

	// Skip authentication in development mode
	const isDevelopment = import.meta.env.MODE === 'development';

	// Show auth screen only in production and if not authenticated
	if (!isDevelopment && !isAuthenticated) {
		return <AuthConnect />;
	}

	return (
		<div className="min-h-screen bg-gray-100">
			<div className="h-screen flex flex-col bg-white">
				<header className="flex-shrink-0 bg-white border-b border-gray-200">
					<div className="flex items-center justify-between px-4">
						<button
							onClick={() => setIsSidebarOpen(!isSidebarOpen)}
							className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
							title="Toggle Sidebar"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 6h16M4 12h16M4 18h16"
								/>
							</svg>
						</button>
						<div className="flex-1">
							<h1 className="text-3xl font-bold text-center text-gray-900 pt-6">firma-sign</h1>
							<h4 className="text-center text-gray-500 pb-6">
								Zero‑friction digital signatures — anywhere, any device, no lock‑in.
							</h4>
							{isDevelopment && (
								<div className="text-center pb-2">
									<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
										Development Mode - No authentication required
									</span>
								</div>
							)}
						</div>
						<div className="w-9" /> {/* Spacer for centering */}
					</div>
				</header>

				<main className="flex-1 flex overflow-hidden">
					{/* Sidebar with File Explorer */}
					<aside
						className={`bg-gray-800 border-r border-gray-700 transition-all duration-300 ${
							isSidebarOpen ? '' : 'w-0'
						} overflow-hidden relative`}
						style={{
							width: isSidebarOpen ? `${sidebarWidth}px` : '0px',
							transition: isSidebarOpen ? 'none' : 'width 300ms ease-in-out',
						}}
					>
						<div className="h-full" style={{ width: `${sidebarWidth}px` }}>
							<FileExplorer onFileSelect={handleFileSelect} />
						</div>

						{/* Resize Handle */}
						{isSidebarOpen && (
							<div
								ref={resizeRef}
								className={`absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500/30 transition-colors group ${
									isResizing ? 'bg-blue-500/50' : 'bg-transparent'
								}`}
								onMouseDown={handleResizeStart}
								title="Drag to resize sidebar width"
								style={{ marginRight: '-4px' }} // Extend beyond the border
							>
								{/* Visual indicator */}
								<div className="absolute inset-y-0 right-1 w-0.5 bg-gray-600 group-hover:bg-blue-500 transition-colors" />

								{/* Resize dots for better visibility */}
								<div className="absolute top-1/2 right-0.5 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
									<div className="flex flex-col space-y-1">
										<div className="w-1 h-1 bg-blue-500 rounded-full"></div>
										<div className="w-1 h-1 bg-blue-500 rounded-full"></div>
										<div className="w-1 h-1 bg-blue-500 rounded-full"></div>
									</div>
								</div>
							</div>
						)}
					</aside>

					{/* Main Content Area */}
					<div className="flex-1 flex overflow-hidden">
						{/* Center Content - Documents */}
						<div className="flex-1 flex flex-col overflow-hidden">
							<DocumentsModule selectedFile={selectedFile} />
						</div>

						{/* Right Panel - PeerExplorer */}
						<aside
							className={`bg-gray-800 border-l border-gray-700 transition-all duration-300 ${
								isRightPanelOpen ? '' : 'w-0'
							} overflow-hidden relative`}
							style={{
								width: isRightPanelOpen ? `${rightPanelWidth}px` : '0px',
								transition: isRightPanelOpen ? 'none' : 'width 300ms ease-in-out',
							}}
						>
							<div className="h-full" style={{ width: `${rightPanelWidth}px` }}>
								{/* Right Panel Header */}
								<div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
									<div className="flex items-center justify-between">
										<h2 className="text-lg font-semibold text-white flex items-center gap-2">
											<span>🌐</span>
											<span>Network Explorer</span>
										</h2>
										<button
											onClick={() => setIsRightPanelOpen(false)}
											className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
											title="Close Network Panel"
										>
											<svg
												className="w-4 h-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M6 18L18 6M6 6l12 12"
												/>
											</svg>
										</button>
									</div>
								</div>

								{/* PeerExplorer Content */}
								<div className="flex-1 overflow-hidden bg-gray-800 h-full">
									<PeerExplorer className="h-full" />
								</div>
							</div>

							{/* Left Resize Handle for Right Panel */}
							{isRightPanelOpen && (
								<div
									ref={rightPanelResizeRef}
									className={`absolute top-0 left-0 w-2 h-full cursor-col-resize hover:bg-blue-500/30 transition-colors group ${
										isRightPanelResizing ? 'bg-blue-500/50' : 'bg-transparent'
									}`}
									onMouseDown={handleRightPanelResizeStart}
									title="Drag to resize right panel width"
									style={{ marginLeft: '-4px' }} // Extend beyond the border
								>
									{/* Visual indicator */}
									<div className="absolute inset-y-0 left-1 w-0.5 bg-gray-600 group-hover:bg-blue-500 transition-colors" />

									{/* Resize dots for better visibility */}
									<div className="absolute top-1/2 left-0.5 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
										<div className="flex flex-col space-y-1">
											<div className="w-1 h-1 bg-blue-500 rounded-full"></div>
											<div className="w-1 h-1 bg-blue-500 rounded-full"></div>
											<div className="w-1 h-1 bg-blue-500 rounded-full"></div>
										</div>
									</div>
								</div>
							)}
						</aside>
					</div>

					{/* Right Panel Toggle Button */}
					{!isRightPanelOpen && (
						<div className="fixed top-1/2 right-4 transform -translate-y-1/2 z-10">
							<button
								onClick={() => setIsRightPanelOpen(true)}
								className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-l-lg shadow-lg transition-colors"
								title="Open Network Panel"
							>
								<div className="flex flex-col items-center gap-1">
									<span className="text-xs">🌐</span>
									<span className="text-xs font-medium">Network</span>
								</div>
							</button>
						</div>
					)}
				</main>
			</div>
		</div>
	);
};

const App: React.FC = () => {
	return (
		<AuthProvider>
			<AppContent />
		</AuthProvider>
	);
};

export default App;
