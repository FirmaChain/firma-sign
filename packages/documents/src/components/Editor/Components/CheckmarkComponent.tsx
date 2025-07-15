import React from 'react';
import { ComponentProps, ViewMode } from '../types';

export const CheckmarkComponent: React.FC<ComponentProps> = ({
	component,
	viewMode,
}) => {
	return (
		<div
			className="w-full h-full flex items-center justify-center"
			style={{
				backgroundColor: component.config?.backgroundColor || '#f0f9ff',
			}}
		>
			{viewMode === ViewMode.EDITOR ? (
				<div className="w-full h-full flex items-center justify-center text-xs text-gray-500 border border-dashed border-gray-300">
					✓ Checkmark
				</div>
			) : (
				<div className="w-full h-full flex items-center justify-center text-2xl font-bold">
					<div style={{ color: component.config?.color || component.assigned?.color || '#10b981' }}>
						✓
					</div>
				</div>
			)}
		</div>
	);
};
