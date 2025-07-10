import React from 'react';
import { ComponentProps } from '../types';

export const RectangleComponent: React.FC<ComponentProps> = ({
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
	const handleClick = () => {
		if (onSelect) {
			onSelect(component.id);
		}
	};

	return (
		<div
			className={`absolute cursor-pointer border-2 ${
				isSelected ? 'border-blue-500' : 'border-gray-400'
			} ${isHovered ? 'border-blue-400' : ''}`}
			style={{
				left: component.position.x * scale,
				top: component.position.y * scale,
				width: component.size.width * scale,
				height: component.size.height * scale,
				backgroundColor: component.config.backgroundColor || 'transparent',
				borderColor: component.assigned.color || '#6b7280',
				borderWidth: (component.config.borderWidth || 2) * scale,
				borderRadius: (component.config.borderRadius || 0) * scale,
			}}
			onClick={handleClick}
		>
			{viewMode === 'editor' && (
				<div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
					Rectangle
				</div>
			)}
		</div>
	);
};
