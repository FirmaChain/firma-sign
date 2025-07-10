import React from 'react';

interface LoadingComponentProps {
	isLoading?: boolean;
	message?: string;
}

export const LoadingComponent: React.FC<LoadingComponentProps> = ({ 
	isLoading = true, 
	message = 'Loading PDF...' 
}) => (
	<div className="absolute inset-0 flex items-center justify-center bg-gray-50">
		<div className="text-center">
			<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
			<div className="text-gray-600">{isLoading ? message : 'PDF Loading...'}</div>
		</div>
	</div>
);