import type React from 'react';
import { useState, useCallback, useRef, useEffect } from 'react';
import DocumentsModule from './components/DocumentsModule';
import FileExplorer from './components/FileExplorer/FileExplorer';
import AuthConnect from './components/AuthConnect';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { FileItem } from './components/FileExplorer/types';

const AppContent: React.FC = () => {
	const { isAuthenticated } = useAuth();
	const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);
	const [sidebarWidth, setSidebarWidth] = useState(256); // Default 256px (w-64)
	const [isResizing, setIsResizing] = useState(false);
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
	}, []);

	// Save sidebar width to localStorage
	const saveSidebarWidth = useCallback((width: number) => {
		localStorage.setItem('sidebarWidth', width.toString());
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
	const handleResizeMove = useCallback((e: MouseEvent) => {
		if (!isResizing) return;
		
		const newWidth = e.clientX;
		const minWidth = 200;
		const maxWidth = 600;
		
		if (newWidth >= minWidth && newWidth <= maxWidth) {
			setSidebarWidth(newWidth);
		}
	}, [isResizing]);

	// Handle mouse up to end resize
	const handleResizeEnd = useCallback(() => {
		if (isResizing) {
			setIsResizing(false);
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
			document.body.classList.remove('select-none');
			saveSidebarWidth(sidebarWidth);
		}
	}, [isResizing, sidebarWidth, saveSidebarWidth]);

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
	}, [isResizing, handleResizeMove, handleResizeEnd]);

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
							transition: isSidebarOpen ? 'none' : 'width 300ms ease-in-out'
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
					<div className="flex-1 overflow-hidden">
						<DocumentsModule selectedFile={selectedFile} />
					</div>
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
