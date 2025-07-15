import React from 'react';
import { ComponentProps, ViewMode } from '../types';

export const SignatureComponent: React.FC<ComponentProps> = ({
	component,
	viewMode,
	onUpdate,
}) => {
	const handleSign = () => {
		if (onUpdate && viewMode !== ViewMode.EDITOR) {
			onUpdate({
				...component,
				value: `Signed by ${component.assigned?.name || 'User'} at ${new Date().toLocaleString()}`,
			});
		}
	};

	return (
		<div
			className="w-full h-full border-2 border-dashed flex items-center justify-center text-xs"
			style={{
				backgroundColor: component.config?.backgroundColor || '#f8f9ff',
				borderColor: component.assigned?.color || '#3b82f6',
			}}
		>
			{viewMode === ViewMode.EDITOR ? (
				<div className="text-gray-500">✒️ Signature: {component.assigned?.name}</div>
			) : (
				<div
					className={`cursor-pointer ${component.value ? 'text-green-600' : 'text-gray-400'} pointer-events-auto`}
					onClick={handleSign}
				>
					{component.value ? '✓ Signed' : 'Click to sign'}
				</div>
			)}
		</div>
	);
};
