import React from 'react';
import { ComponentProps, ViewMode } from '../types';

export const StampComponent: React.FC<ComponentProps> = ({
	component,
	viewMode,
}) => {
	return (
		<div
			className="w-full h-full border-2 rounded-full flex items-center justify-center text-xs font-semibold"
			style={{
				backgroundColor: component.config?.backgroundColor || '#f0f9ff',
				borderColor: component.assigned?.color || '#3b82f6',
			}}
		>
			{viewMode === ViewMode.EDITOR ? (
				<div className="text-gray-500">🏷️ STAMP</div>
			) : (
				<div style={{ color: component.config?.color || component.assigned?.color || '#3b82f6' }}>
					APPROVED
				</div>
			)}
		</div>
	);
};
