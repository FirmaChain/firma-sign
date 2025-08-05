import React from 'react';
import { ComponentProps, ViewMode } from '../types';

export const TextComponent: React.FC<ComponentProps> = ({
	component,
	isSelected: _isSelected,
	isHovered: _isHovered,
	isFocused: _isFocused,
	viewMode,
	scale: _scale,
	onUpdate,
	onSelect: _onSelect,
	onDelete: _onDelete,
	onStartDrag: _onStartDrag,
	onStartResize: _onStartResize,
}) => {
	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
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
					{component.value || 'Text Field'}
				</div>
			) : (
				<input
					type="text"
					value={component.value || ''}
					onChange={handleChange}
					placeholder={component.config?.placeholder || 'Enter text...'}
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
