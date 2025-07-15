import React from 'react';
import { ComponentProps, ViewMode } from '../types';

export const LineComponent: React.FC<ComponentProps> = ({ component, viewMode }) => {
	return (
		<div className="w-full h-full relative">
			<div
				className="w-full"
				style={{
					borderTop: `${component.config?.borderWidth || 2}px solid ${
						component.assigned?.color || '#6b7280'
					}`,
					transform: 'translateY(50%)',
				}}
			/>
			{viewMode === ViewMode.EDITOR && (
				<div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 pointer-events-none">
					— Line
				</div>
			)}
		</div>
	);
};
