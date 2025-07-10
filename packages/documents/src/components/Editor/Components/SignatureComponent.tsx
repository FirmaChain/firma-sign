import React from 'react';
import { ComponentProps } from '../types';

export const SignatureComponent: React.FC<ComponentProps> = ({
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
				backgroundColor: component.config.backgroundColor || '#f8f9ff',
				borderColor: component.assigned.color || '#3b82f6',
			}}
			onClick={handleClick}
		>
			<div className="w-full h-full flex items-center justify-center text-xs">
				{viewMode === 'editor' ? (
					<div className="text-gray-500">Signature: {component.assigned.name}</div>
				) : (
					<div className="text-gray-400">{component.value ? '✓ Signed' : 'Click to sign'}</div>
				)}
			</div>
		</div>
	);
};
