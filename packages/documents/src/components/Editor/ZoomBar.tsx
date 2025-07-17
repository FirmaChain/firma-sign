import React, { useCallback } from 'react';
import { cn } from '../../utils/cn';

interface ZoomBarProps {
	scale: number;
	onScaleChange: (scale: number) => void;
	className?: string;
}

export const ZoomBar: React.FC<ZoomBarProps> = ({ scale, onScaleChange, className }) => {
	const handleZoomIn = useCallback(() => {
		const newScale = Math.min(scale * 1.2, 3); // Max 300%
		onScaleChange(newScale);
	}, [scale, onScaleChange]);

	const handleZoomOut = useCallback(() => {
		const newScale = Math.max(scale * 0.8, 0.2); // Min 20%
		onScaleChange(newScale);
	}, [scale, onScaleChange]);

	const handleReset = useCallback(() => {
		onScaleChange(1);
	}, [onScaleChange]);

	const handleFitToWidth = useCallback(() => {
		// This would calculate the optimal scale to fit content width
		onScaleChange(0.8);
	}, [onScaleChange]);

	const predefinedScales = [0.5, 0.75, 1, 1.25, 1.5, 2];

	return (
		<div
			className={cn(
				'bg-white border border-gray-200 rounded-lg shadow-lg',
				'flex items-center gap-1 p-1',
				'text-sm',
				className,
			)}
		>
			{/* Zoom Out Button */}
			<button
				onClick={handleZoomOut}
				disabled={scale <= 0.2}
				className={cn(
					'p-2 rounded hover:bg-gray-100',
					'disabled:opacity-50 disabled:cursor-not-allowed',
					'transition-colors',
				)}
				title="Zoom Out"
			>
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
				</svg>
			</button>

			{/* Scale Display/Selector */}
			<div className="relative">
				<select
					value={scale}
					onChange={(e) => onScaleChange(parseFloat(e.target.value))}
					className={cn(
						'appearance-none bg-transparent border-none',
						'text-center font-medium',
						'cursor-pointer',
						'w-16 pr-2',
					)}
				>
					{predefinedScales.map((scaleValue) => (
						<option key={scaleValue} value={scaleValue}>
							{Math.round(scaleValue * 100)}%
						</option>
					))}
					{!predefinedScales.includes(scale) && (
						<option value={scale}>{Math.round(scale * 100)}%</option>
					)}
				</select>
			</div>

			{/* Zoom In Button */}
			<button
				onClick={handleZoomIn}
				disabled={scale >= 3}
				className={cn(
					'p-2 rounded hover:bg-gray-100',
					'disabled:opacity-50 disabled:cursor-not-allowed',
					'transition-colors',
				)}
				title="Zoom In"
			>
				<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
				</svg>
			</button>

			{/* Separator */}
			<div className="w-px h-6 bg-gray-300 mx-1" />

			{/* Fit to Width Button */}
			<button
				onClick={handleFitToWidth}
				className={cn('px-2 py-1 text-xs rounded hover:bg-gray-100', 'transition-colors')}
				title="Fit to Width"
			>
				Fit
			</button>

			{/* Reset Button */}
			<button
				onClick={handleReset}
				className={cn('px-2 py-1 text-xs rounded hover:bg-gray-100', 'transition-colors')}
				title="Reset Zoom"
			>
				100%
			</button>
		</div>
	);
};

export default ZoomBar;
