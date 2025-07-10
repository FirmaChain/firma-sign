import React from 'react';

interface ZoomBarProps {
	displayScale: number;
	onScaleChange: (scale: number) => void;
}

export const ZoomBar: React.FC<ZoomBarProps> = ({ displayScale, onScaleChange }) => (
	<div className="absolute bottom-4 left-4 z-10">
		<div className="bg-white rounded-lg shadow-lg p-2 border border-gray-200">
			<div className="flex items-center gap-2 text-sm">
				<button
					onClick={() => onScaleChange(displayScale * 0.9)}
					className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
				>
					-
				</button>
				<span className="px-2">{Math.round(displayScale * 100)}%</span>
				<button
					onClick={() => onScaleChange(displayScale * 1.1)}
					className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
				>
					+
				</button>
			</div>
		</div>
	</div>
);
