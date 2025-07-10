import React from 'react';

interface ErrorComponentProps {
	error: string;
	currentUrlIndex: number;
	totalUrls: number;
	onRetry: () => void;
}

export const ErrorComponent: React.FC<ErrorComponentProps> = ({
	error,
	currentUrlIndex,
	totalUrls,
	onRetry,
}) => (
	<div className="absolute inset-0 flex items-center justify-center bg-gray-50">
		<div className="text-center">
			<div className="text-red-500 mb-2">⚠️</div>
			<div className="text-gray-600 mb-2">{error || 'Failed to load PDF'}</div>
			<div className="text-sm text-gray-500">
				Tried {currentUrlIndex + 1} of {totalUrls} sources
			</div>
			<button
				onClick={onRetry}
				className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
			>
				Retry
			</button>
		</div>
	</div>
);
