import type React from 'react';
import { forwardRef } from 'react';

interface FileSearchProps {
	searchQuery: string;
	onSearch: (query: string) => void;
	onClear: () => void;
}

const FileSearch = forwardRef<HTMLInputElement, FileSearchProps>(
	({ searchQuery, onSearch, onClear }, ref) => {
	return (
		<div className="px-3 py-2 border-b border-gray-700">
			<div className="relative">
				<input
					ref={ref}
					type="text"
					placeholder="Search files..."
					value={searchQuery}
					onChange={(e) => onSearch(e.target.value)}
					className="w-full bg-gray-700 text-gray-200 text-sm px-8 py-1.5 rounded border border-gray-600 focus:border-blue-500 focus:outline-none placeholder-gray-500"
					aria-label="Search files"
				/>
				<svg
					className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				{searchQuery && (
					<button
						onClick={onClear}
						className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				)}
			</div>
		</div>
	);
});

FileSearch.displayName = 'FileSearch';

export default FileSearch;