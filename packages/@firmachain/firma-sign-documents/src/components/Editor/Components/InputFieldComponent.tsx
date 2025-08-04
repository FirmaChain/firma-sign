import React from 'react';
import { ComponentProps, ViewMode } from '../types';

export const InputFieldComponent: React.FC<ComponentProps> = ({
	component,
	isSelected,
	isHovered,
	isFocused,
	viewMode,
	scale,
	onUpdate,
	onSelect,
	onDelete,
	onStartDrag,
	onStartResize,
}) => {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (onUpdate) {
			onUpdate({
				...component,
				value: e.target.value,
			});
		}
	};

	const isMultiline = component.config?.multiline || false;

	return (
		<div
			className="w-full h-full flex items-center justify-center"
			style={{
				backgroundColor: component.config?.backgroundColor || '#ffffff',
			}}
		>
			{viewMode === ViewMode.EDITOR ? (
				<div className="w-full h-full flex items-center justify-center text-xs text-gray-500 border border-dashed border-gray-300">
					{component.value || 'Input Field'}
				</div>
			) : isMultiline ? (
				<textarea
					value={component.value || ''}
					onChange={handleChange}
					placeholder={component.config?.placeholder || 'Enter text...'}
					maxLength={component.config?.maxLength}
					className="w-full h-full border-none outline-none bg-transparent resize-none px-2 py-1 pointer-events-auto"
					style={{
						fontSize: component.config?.fontSize || 12,
						color: component.config?.color || '#000000',
					}}
					onClick={(e) => e.stopPropagation()}
				/>
			) : (
				<input
					type="text"
					value={component.value || ''}
					onChange={handleChange}
					placeholder={component.config?.placeholder || 'Enter text...'}
					maxLength={component.config?.maxLength}
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
