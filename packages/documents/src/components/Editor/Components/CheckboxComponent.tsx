import React from 'react';
import { ComponentProps } from '../types';

export const CheckboxComponent: React.FC<ComponentProps> = ({
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

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (onUpdate) {
			onUpdate({
				...component,
				value: e.target.checked.toString(),
			});
		}
	};

	const isChecked = component.value === 'true';

	return (
		<div
			className={`absolute cursor-pointer border-2 ${
				isSelected ? 'border-blue-500' : 'border-gray-300'
			} ${isHovered ? 'border-blue-400' : ''}`}
			style={{
				left: component.position.x * scale,
				top: component.position.y * scale,
				width: component.size.width * scale,
				height: component.size.height * scale,
				backgroundColor: component.config.backgroundColor || '#ffffff',
				borderColor: component.assigned.color || '#3b82f6',
			}}
			onClick={handleClick}
		>
			<div className="w-full h-full flex items-center justify-center">
				{viewMode === 'editor' ? (
					<div className="text-xs text-gray-500">☑</div>
				) : (
					<input
						type="checkbox"
						checked={isChecked}
						onChange={handleChange}
						className="w-4 h-4"
						style={{
							accentColor: component.assigned.color || '#3b82f6',
						}}
					/>
				)}
			</div>
		</div>
	);
};
