import React from 'react';
import { ComponentProps, ViewMode } from '../types';

export const ExtraComponent: React.FC<ComponentProps> = ({ component, viewMode }) => {
	return (
		<div
			className="w-full h-full border-2 border-dashed"
			style={{
				backgroundColor: component.config?.backgroundColor || '#fafafa',
				borderColor: component.assigned?.color || '#6b7280',
			}}
		>
			<div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
				{viewMode === ViewMode.EDITOR ? '📎 Extra Component' : 'Extra'}
			</div>
		</div>
	);
};
