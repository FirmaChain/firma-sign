import type React from 'react';
import type { OrganizationMode } from './hooks/useFileSystem';

interface FileExplorerHeaderProps {
	onNewFolder: () => void;
	onUpload: () => void;
	onRefresh: () => void;
	organizationMode: OrganizationMode;
	onModeChange: (mode: OrganizationMode) => void;
}

const FileExplorerHeader: React.FC<FileExplorerHeaderProps> = ({
	onNewFolder,
	onUpload,
	onRefresh,
	organizationMode,
	onModeChange,
}) => {
	return (
		<div className="flex flex-col border-b border-gray-700">
			<div className="flex items-center justify-between px-3 py-2">
				<h3 className="text-sm font-semibold text-gray-200">Files</h3>
				<div className="flex items-center gap-1">
					{/* Show New Folder button only in manual mode */}
					{organizationMode === 'manual' && (
						<button
							onClick={onNewFolder}
							className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
							title="New Folder"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
								/>
							</svg>
						</button>
					)}
					<button
						onClick={onUpload}
						className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
						title="Upload File"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>
					</button>
					<button
						onClick={onRefresh}
						className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors"
						title="Refresh"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
					</button>
				</div>
			</div>
			{/* Organization Mode Toggle */}
			<div className="flex items-center justify-between px-3 py-2 bg-gray-750 border-t border-gray-700">
			<span className="text-xs text-gray-400">Organization Mode:</span>
			<div className="flex items-center gap-1">
				<button
					onClick={() => onModeChange('manual')}
					className={`px-2 py-1 text-xs rounded transition-colors ${
						organizationMode === 'manual'
							? 'bg-blue-600 text-white'
							: 'bg-gray-700 text-gray-400 hover:bg-gray-600'
					}`}
					title="Manual organization - Create your own folder structure"
				>
					Manual
				</button>
				<button
					onClick={() => onModeChange('automatic')}
					className={`px-2 py-1 text-xs rounded transition-colors ${
						organizationMode === 'automatic'
							? 'bg-blue-600 text-white'
							: 'bg-gray-700 text-gray-400 hover:bg-gray-600'
					}`}
					title="Automatic organization - Files are grouped by category"
				>
					Automatic
				</button>
			</div>
		</div>
		</div>
	);
};

export default FileExplorerHeader;