import type React from 'react';
import { useState } from 'react';
import DocumentsModule from './components/DocumentsModule';
import FileExplorer from './components/FileExplorer/FileExplorer';
import AuthConnect from './components/AuthConnect';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { FileItem } from './components/FileExplorer/types';

const AppContent: React.FC = () => {
	const { isAuthenticated } = useAuth();
	const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);

	const handleFileSelect = (file: FileItem) => {
		setSelectedFile(file);
	};

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
							isSidebarOpen ? 'w-64' : 'w-0'
						} overflow-hidden`}
					>
						<div className="w-64 h-full">
							<FileExplorer onFileSelect={handleFileSelect} />
						</div>
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
