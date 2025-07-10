import React from 'react';
import { ComponentProps } from '../types';

export const LineComponent: React.FC<ComponentProps> = ({
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
			className={`absolute cursor-pointer ${
				isSelected ? 'border-2 border-blue-500' : ''
			} ${isHovered ? 'border-2 border-blue-400' : ''}`}
			style={{
				left: component.position.x * scale,
				top: component.position.y * scale,
				width: component.size.width * scale,
				height: component.size.height * scale,
			}}
			onClick={handleClick}
		>
			<div
				className="w-full"
				style={{
					borderTop: `${(component.config.borderWidth || 2) * scale}px solid ${
						component.assigned.color || '#6b7280'
					}`,
					transform: 'translateY(50%)',
				}}
			/>
			{viewMode === 'editor' && (
				<div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 pointer-events-none">
					Line
				</div>
			)}
		</div>
	);
};
