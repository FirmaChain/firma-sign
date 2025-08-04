import React, { useCallback } from 'react';
import { cn } from '../../utils/cn';

interface RibbonMenuProps {
	contractName?: string;
	handleFinishInput?: () => void;
	btnDisabled?: boolean;
	viewMode?: string;
	hideSave?: boolean;
	enableNext?: boolean;
	onFinish?: () => void;
	hideActionBtn?: boolean;
	className?: string;
}

export const RibbonMenu: React.FC<RibbonMenuProps> = ({
	contractName = 'Document',
	handleFinishInput,
	btnDisabled = false,
	viewMode = 'editor',
	hideSave = false,
	enableNext = false,
	onFinish,
	hideActionBtn = false,
	className,
}) => {
	const handleSave = useCallback(() => {
		console.log('Save document');
		// Handle save logic
	}, []);

	const handlePreview = useCallback(() => {
		console.log('Preview document');
		// Handle preview logic
	}, []);

	const handleFinish = useCallback(() => {
		if (onFinish) {
			onFinish();
		} else if (handleFinishInput) {
			handleFinishInput();
		}
	}, [onFinish, handleFinishInput]);

	const isEditingMode = viewMode === 'editor';
	const isInputMode = viewMode === 'input';
	const isSignMode = viewMode === 'sign';

	return (
		<div
			className={cn(
				'bg-white border border-gray-200 rounded-lg shadow-lg',
				'flex items-center justify-between',
				'p-3 min-w-0',
				'max-w-4xl mx-auto',
				className,
			)}
		>
			{/* Left section - Document name */}
			<div className="flex items-center gap-3 min-w-0">
				<div className="flex items-center gap-2">
					<div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
						<svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
						</svg>
					</div>
					<h1 className="font-medium text-gray-900 truncate">{contractName}</h1>
				</div>

				{/* Status indicator */}
				<div
					className={cn(
						'text-xs px-2 py-1 rounded-full',
						isEditingMode && 'bg-blue-100 text-blue-700',
						isInputMode && 'bg-yellow-100 text-yellow-700',
						isSignMode && 'bg-green-100 text-green-700',
					)}
				>
					{isEditingMode && 'Editing'}
					{isInputMode && 'Input'}
					{isSignMode && 'Signing'}
				</div>
			</div>

			{/* Right section - Actions */}
			{!hideActionBtn && (
				<div className="flex items-center gap-2">
					{isEditingMode && (
						<>
							{!hideSave && (
								<button
									onClick={handleSave}
									className={cn(
										'px-4 py-2 text-sm font-medium rounded-md',
										'bg-gray-100 text-gray-700 hover:bg-gray-200',
										'transition-colors',
									)}
								>
									Save
								</button>
							)}

							<button
								onClick={handlePreview}
								className={cn(
									'px-4 py-2 text-sm font-medium rounded-md',
									'bg-blue-500 text-white hover:bg-blue-600',
									'transition-colors',
								)}
							>
								Preview
							</button>
						</>
					)}

					{(isInputMode || isSignMode) && (
						<button
							onClick={handleFinish}
							disabled={btnDisabled}
							className={cn(
								'px-6 py-2 text-sm font-medium rounded-md',
								'transition-colors',
								btnDisabled
									? 'bg-gray-300 text-gray-500 cursor-not-allowed'
									: 'bg-green-500 text-white hover:bg-green-600',
							)}
						>
							{isInputMode && 'Complete Input'}
							{isSignMode && 'Sign Document'}
						</button>
					)}

					{enableNext && (
						<button
							onClick={handleFinish}
							disabled={btnDisabled}
							className={cn(
								'px-6 py-2 text-sm font-medium rounded-md',
								'transition-colors',
								btnDisabled
									? 'bg-gray-300 text-gray-500 cursor-not-allowed'
									: 'bg-blue-500 text-white hover:bg-blue-600',
							)}
						>
							Next
						</button>
					)}
				</div>
			)}
		</div>
	);
};

export default RibbonMenu;
