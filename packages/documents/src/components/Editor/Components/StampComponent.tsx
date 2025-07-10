import React from 'react';
import { ComponentProps } from '../types';

export const StampComponent: React.FC<ComponentProps> = ({
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
				isSelected ? 'border-blue-500' : 'border-gray-300'
			} ${isHovered ? 'border-blue-400' : ''} rounded-full`}
			style={{
				left: component.position.x * scale,
				top: component.position.y * scale,
				width: component.size.width * scale,
				height: component.size.height * scale,
				backgroundColor: component.config.backgroundColor || '#f0f9ff',
				borderColor: component.assigned.color || '#3b82f6',
			}}
			onClick={handleClick}
		>
			<div className="w-full h-full flex items-center justify-center text-xs font-semibold rounded-full">
				{viewMode === 'editor' ? (
					<div className="text-gray-500">STAMP</div>
				) : (
					<div style={{ color: component.config.color || component.assigned.color || '#3b82f6' }}>
						APPROVED
					</div>
				)}
			</div>
		</div>
	);
};
