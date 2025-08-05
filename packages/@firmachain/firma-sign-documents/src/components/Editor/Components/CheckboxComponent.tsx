import React from 'react';
import { ComponentProps, ViewMode } from '../types';

export const CheckboxComponent: React.FC<ComponentProps> = ({ component, viewMode, onUpdate }) => {
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
			className="w-full h-full flex items-center justify-center"
			style={{
				backgroundColor: component.config?.backgroundColor || '#ffffff',
			}}
		>
			{viewMode === ViewMode.EDITOR ? (
				<div className="w-full h-full flex items-center justify-center text-xs text-gray-500 border border-dashed border-gray-300">
					☑ Checkbox
				</div>
			) : (
				<input
					type="checkbox"
					checked={isChecked}
					onChange={handleChange}
					className="w-4 h-4 pointer-events-auto"
					style={{
						accentColor: component.assigned?.color || '#3b82f6',
					}}
					onClick={(e) => e.stopPropagation()}
				/>
			)}
		</div>
	);
};
