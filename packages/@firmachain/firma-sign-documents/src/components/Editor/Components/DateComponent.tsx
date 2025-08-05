import React from 'react';
import { ComponentProps, ViewMode } from '../types';

export const DateComponent: React.FC<ComponentProps> = ({ component, viewMode, onUpdate }) => {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (onUpdate) {
			onUpdate({
				...component,
				value: e.target.value,
			});
		}
	};

	return (
		<div
			className="w-full h-full flex items-center justify-center"
			style={{
				backgroundColor: component.config?.backgroundColor || '#ffffff',
			}}
		>
			{viewMode === ViewMode.EDITOR ? (
				<div className="w-full h-full flex items-center justify-center text-xs text-gray-500 border border-dashed border-gray-300">
					📅 Date Field
				</div>
			) : (
				<input
					type="date"
					value={component.value || ''}
					onChange={handleChange}
					className="w-full h-full border-none outline-none bg-transparent px-2 pointer-events-auto"
					style={{
						fontSize: component.config?.fontSize || 12,
						color: component.config?.color || '#000000',
					}}
					onClick={(e) => e.stopPropagation()}
				/>
			)}
		</div>
	);
};
