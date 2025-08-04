import React from 'react';
import { ComponentProps, ViewMode } from '../types';

export const CircleComponent: React.FC<ComponentProps> = ({ component, viewMode }) => {
	return (
		<div
			className="w-full h-full rounded-full"
			style={{
				backgroundColor: component.config?.backgroundColor || 'transparent',
				border: `${component.config?.borderWidth || 2}px solid ${component.assigned?.color || '#6b7280'}`,
			}}
		>
			{viewMode === ViewMode.EDITOR && (
				<div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
					○ Circle
				</div>
			)}
		</div>
	);
};
