import React from 'react';
import { ComponentProps } from '../types';

export const ExtraComponent: React.FC<ComponentProps> = ({
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
			className={`absolute cursor-pointer border-2 border-dashed ${
				isSelected ? 'border-blue-500' : 'border-gray-400'
			} ${isHovered ? 'border-blue-400' : ''}`}
			style={{
				left: component.position.x * scale,
				top: component.position.y * scale,
				width: component.size.width * scale,
				height: component.size.height * scale,
				backgroundColor: component.config.backgroundColor || '#fafafa',
				borderColor: component.assigned.color || '#6b7280',
			}}
			onClick={handleClick}
		>
			<div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
				Extra Component
			</div>
		</div>
	);
};
