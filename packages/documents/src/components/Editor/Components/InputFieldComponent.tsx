import React from 'react';
import { ComponentProps } from '../types';

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
	const handleClick = () => {
		if (onSelect) {
			onSelect(component.id);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (onUpdate) {
			onUpdate({
				...component,
				value: e.target.value,
			});
		}
	};

	const isMultiline = component.config.multiline || false;

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
			{viewMode === 'editor' ? (
				<div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
					Input Field
				</div>
			) : isMultiline ? (
				<textarea
					value={component.value || ''}
					onChange={handleChange}
					placeholder={component.config.placeholder || 'Enter text...'}
					maxLength={component.config.maxLength}
					className="w-full h-full border-none outline-none bg-transparent resize-none px-2 py-1"
					style={{
						fontSize: (component.config.fontSize || 12) * scale,
						color: component.config.color || '#000000',
					}}
				/>
			) : (
				<input
					type="text"
					value={component.value || ''}
					onChange={handleChange}
					placeholder={component.config.placeholder || 'Enter text...'}
					maxLength={component.config.maxLength}
					className="w-full h-full border-none outline-none bg-transparent px-2"
					style={{
						fontSize: (component.config.fontSize || 12) * scale,
						color: component.config.color || '#000000',
					}}
				/>
			)}
		</div>
	);
};
