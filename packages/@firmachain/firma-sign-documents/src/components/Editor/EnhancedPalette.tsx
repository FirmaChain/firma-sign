import React, { useCallback, useMemo, useState, useRef } from 'react';
import { cn } from '../../utils/cn';
import { ComponentType, ViewMode, AssignedUser } from './types';
import { TOOLS_INFO } from './constants';
import { usePanelDimensions } from './FloatingPanel';

interface PaletteProps {
	signers: AssignedUser[];
	selectedTool?: ComponentType | null;
	onToolSelect?: (tool: ComponentType) => void;
	onUserSelect?: (user: AssignedUser) => void;
	onDragStart?: (toolType: ComponentType, signer?: AssignedUser) => void;
	viewMode?: ViewMode;
	className?: string;
	numPages?: number;
	selectedPage?: number;
	onPageSelect?: (page: number) => void;
}

interface MenuBoxProps {
	selectedTool?: ComponentType | null;
	toolType: ComponentType;
	signers?: AssignedUser[];
	handleSelect?: (signer: AssignedUser) => void;
	title: string;
	tooltip: string;
	onClick: (evt: React.MouseEvent) => void;
	onDragStart?: (toolType: ComponentType, signer?: AssignedUser) => void;
	iconKey: string;
	disabled?: boolean;
	isPopoverActive: boolean;
	onPopoverShow: () => void;
	onPopoverHide: () => void;
	onPopoverKeep: () => void;
	onPopoverClose: () => void;
	isCompact: boolean;
}

const ToolIcons: Record<string, React.ReactNode> = {
	text: (
		<div className="w-4 h-4 border border-gray-400 rounded bg-white flex items-center justify-center text-xs">
			T
		</div>
	),
	signature: <div className="w-4 h-4 text-blue-500">✒️</div>,
	stamp: <div className="w-4 h-4 text-green-500">🏷️</div>,
	checkbox: <div className="w-3 h-3 border border-gray-400 rounded bg-white"></div>,
	checkmark: <div className="w-4 h-4 text-blue-500">✓</div>,
	input: <div className="w-4 h-4 border border-gray-400 rounded bg-white"></div>,
	calendar: <div className="w-4 h-4 text-blue-500">📅</div>,
	extra: <div className="w-4 h-4 text-purple-500">📄</div>,
	rectangle: <div className="w-4 h-3 border border-gray-400 rounded bg-white"></div>,
	circle: <div className="w-4 h-4 border border-gray-400 rounded-full bg-white"></div>,
	line: <div className="w-4 h-0.5 bg-gray-400"></div>,
};

const MenuBox: React.FC<MenuBoxProps> = ({
	selectedTool,
	toolType,
	signers,
	handleSelect,
	title,
	tooltip,
	onClick,
	onDragStart,
	iconKey,
	disabled = false,
	isPopoverActive,
	onPopoverShow,
	onPopoverHide,
	onPopoverKeep,
	onPopoverClose,
	isCompact,
}) => {
	const isSelected = selectedTool === toolType;
	const toolInfo = TOOLS_INFO[toolType];
	const dimensions = usePanelDimensions();

	const handleDragStart = (e: React.DragEvent) => {
		if (disabled) return;

		// Set drag data
		e.dataTransfer.setData(
			'text/plain',
			JSON.stringify({
				toolType,
				needsAssignment: toolInfo.needsAssignment,
			}),
		);

		// Set drag effect
		e.dataTransfer.effectAllowed = 'copy';

		// Call the drag start handler
		if (onDragStart) {
			if (toolInfo.needsAssignment) {
				// For tools that need assignment, we'll handle this differently
				// For now, we'll just pass the tool type
				onDragStart(toolType);
			} else {
				// For tools that don't need assignment, start drag immediately
				onDragStart(toolType);
			}
		}
	};

	const handleSignerDragStart = (e: React.DragEvent, signer: AssignedUser) => {
		e.stopPropagation();

		// Set drag data with signer info
		e.dataTransfer.setData(
			'text/plain',
			JSON.stringify({
				toolType,
				signer,
				needsAssignment: true,
			}),
		);

		e.dataTransfer.effectAllowed = 'copy';

		if (onDragStart) {
			onDragStart(toolType, signer);
		}
	};

	return (
		<div className="relative w-full" onMouseEnter={onPopoverShow} onMouseLeave={onPopoverHide}>
			{/* Extended hover area that covers the gap */}
			{isPopoverActive && !isCompact && (
				<div
					className="absolute top-full left-0 w-full h-3 bg-transparent z-40"
					onMouseEnter={onPopoverKeep}
					onMouseLeave={onPopoverClose}
				/>
			)}
			<button
				onClick={onClick}
				disabled={disabled}
				draggable={!disabled}
				onDragStart={handleDragStart}
				className={cn(
					'w-full rounded-lg border transition-all duration-200',
					'flex items-center justify-center',
					'font-medium',
					// Responsive sizing
					dimensions.isCompact ? 'p-2 flex-col gap-1' : 'p-3 flex-col gap-2',
					dimensions.isCompact ? 'text-xs' : 'text-sm',
					isSelected
						? 'bg-blue-50 border-blue-200 text-blue-700'
						: 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50',
					disabled && 'opacity-50 cursor-not-allowed',
					!disabled && 'cursor-grab active:cursor-grabbing',
				)}
				title={`${tooltip} (Drag to place on document)`}
			>
				<div
					className={cn(
						'flex items-center justify-center',
						dimensions.isCompact ? 'w-4 h-4' : 'w-6 h-6',
					)}
				>
					{ToolIcons[iconKey] || <div className="w-4 h-4 bg-gray-400 rounded" />}
				</div>
				<span
					className={cn('leading-tight text-center', dimensions.isCompact ? 'text-xs' : 'text-xs')}
				>
					{title}
				</span>
				{/* Indicator for neutral tools */}
				{!toolInfo.needsAssignment && (
					<div
						className={cn(
							'absolute bg-green-500 rounded-full',
							dimensions.isCompact ? '-top-0.5 -right-0.5 w-1.5 h-1.5' : '-top-1 -right-1 w-2 h-2',
						)}
						title="Drawing tool - no assignment needed"
					/>
				)}
			</button>

			{/* Hover Popover for tool options */}
			{isPopoverActive && !isCompact && (
				<div
					className={cn(
						'absolute top-full left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50',
						dimensions.isNarrow ? 'w-48' : 'w-64',
						// Position it very close to the button
						'mt-0.5',
					)}
					onMouseEnter={onPopoverKeep}
					onMouseLeave={onPopoverClose}
				>
					<div className="p-3">
						<h4 className="font-medium text-gray-900 mb-2">{title}</h4>

						{/* Signer list for tools that need assignment */}
						{signers && signers.length > 0 && (
							<div className="space-y-2">
								<div className="text-xs text-gray-500 mb-2">Assign to:</div>
								{signers.map((signer) => (
									<button
										key={signer.email}
										onClick={() => handleSelect?.(signer)}
										draggable={true}
										onDragStart={(e) => handleSignerDragStart(e, signer)}
										className={cn(
											'w-full p-2 text-left rounded border transition-colors',
											'flex items-center gap-2',
											'hover:bg-gray-50 cursor-grab active:cursor-grabbing',
										)}
										title={`Drag to place ${title} for ${signer.name}`}
									>
										<div
											className="w-3 h-3 rounded-full"
											style={{ backgroundColor: signer.color }}
										/>
										<span className="text-sm">{signer.name}</span>
										<span className="text-xs text-gray-500">({signer.email})</span>
									</button>
								))}
							</div>
						)}

						{/* Tool info */}
						{toolInfo && (
							<div className="mt-3 pt-3 border-t border-gray-200">
								<div className="text-xs text-gray-500 mb-2">Info:</div>
								<div className="text-xs text-gray-600 space-y-1">
									<div>
										Size: {toolInfo.defaultSize.width}×{toolInfo.defaultSize.height}
									</div>
									<div>Resizable: {toolInfo.canResize ? 'Yes' : 'No'}</div>
									<div>Needs assignment: {toolInfo.needsAssignment ? 'Yes' : 'No'}</div>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export const EnhancedPalette: React.FC<PaletteProps> = ({
	signers,
	selectedTool: _selectedTool,
	onToolSelect,
	onUserSelect,
	onDragStart,
	viewMode = ViewMode.EDITOR,
	className,
	numPages = 1,
	selectedPage = 0,
	onPageSelect,
}) => {
	const dimensions = usePanelDimensions();
	const [activePopover, setActivePopover] = useState<ComponentType | null>(null);
	const popoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const tools = useMemo(() => {
		if (viewMode !== ViewMode.EDITOR) return [];

		return [
			TOOLS_INFO[ComponentType.TEXT],
			TOOLS_INFO[ComponentType.SIGNATURE],
			TOOLS_INFO[ComponentType.STAMP],
			TOOLS_INFO[ComponentType.CHECKBOX],
			TOOLS_INFO[ComponentType.CHECKMARK],
			TOOLS_INFO[ComponentType.INPUT_FIELD],
			TOOLS_INFO[ComponentType.DATE],
			TOOLS_INFO[ComponentType.EXTRA],
			TOOLS_INFO[ComponentType.RECTANGLE],
			TOOLS_INFO[ComponentType.CIRCLE],
			TOOLS_INFO[ComponentType.LINE],
		];
	}, [viewMode]);

	const handleToolClick = useCallback(
		(toolType: ComponentType) => {
			if (onToolSelect) {
				onToolSelect(toolType);
			}
			// No need to manage expanded state since we use hover now
		},
		[onToolSelect],
	);

	const handleSignerSelect = useCallback(
		(signer: AssignedUser) => {
			if (onUserSelect) {
				onUserSelect(signer);
			}
			// No need to close expanded state since we use hover now
		},
		[onUserSelect],
	);

	// Global popover handlers
	const handlePopoverShow = useCallback((toolType: ComponentType) => {
		// Clear any existing timeout
		if (popoverTimeoutRef.current) {
			clearTimeout(popoverTimeoutRef.current);
			popoverTimeoutRef.current = null;
		}
		setActivePopover(toolType);
	}, []);

	const handlePopoverHide = useCallback(() => {
		// Add a delay before hiding the popover
		popoverTimeoutRef.current = setTimeout(() => {
			setActivePopover(null);
		}, 200); // 200ms delay
	}, []);

	const handlePopoverKeep = useCallback(() => {
		// Clear the timeout when mouse enters popover area
		if (popoverTimeoutRef.current) {
			clearTimeout(popoverTimeoutRef.current);
			popoverTimeoutRef.current = null;
		}
	}, []);

	const handlePopoverClose = useCallback(() => {
		// Hide popover immediately when mouse leaves popover
		setActivePopover(null);
	}, []);

	// Cleanup timeout on unmount
	React.useEffect(() => {
		return () => {
			if (popoverTimeoutRef.current) {
				clearTimeout(popoverTimeoutRef.current);
			}
		};
	}, []);

	if (viewMode !== ViewMode.EDITOR) {
		return null;
	}

	// Determine grid layout based on panel width
	const getGridLayout = () => {
		if (dimensions.isCompact) return 'grid-cols-1'; // Single column for very narrow
		if (dimensions.isNarrow) return 'grid-cols-2'; // Two columns for narrow
		return 'grid-cols-2'; // Default two columns
	};

	// Determine if we should show compact UI elements
	const showCompactUI = dimensions.isCompact;
	const showNarrowUI = dimensions.isNarrow;

	return (
		<div className={cn('w-full h-full bg-gray-50', 'flex flex-col', className)}>
			{/* Header */}
			<div className={cn('border-b border-gray-200', showCompactUI ? 'p-2' : 'p-4')}>
				<h2 className={cn('font-semibold text-gray-900', showCompactUI ? 'text-sm' : 'text-base')}>
					{showCompactUI ? 'Tools' : 'Document Tools'}
				</h2>

				{/* Page Selector for Multi-page Documents */}
				{numPages > 1 && (
					<div className={cn('mt-3', showCompactUI && 'mt-2')}>
						{!showCompactUI && (
							<label className="text-sm font-medium text-gray-700">Place on Page:</label>
						)}
						<select
							value={selectedPage}
							onChange={(e) => onPageSelect?.(parseInt(e.target.value))}
							className={cn(
								'rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
								showCompactUI ? 'mt-0 w-full text-xs' : 'mt-1 block w-full sm:text-sm',
							)}
						>
							{Array.from({ length: numPages }, (_, i) => (
								<option key={i} value={i}>
									{showCompactUI ? `P${i + 1}` : `Page ${i + 1}`}
								</option>
							))}
						</select>
					</div>
				)}
			</div>

			{/* Tools Grid */}
			<div className="flex-1 overflow-y-auto">
				<div className={cn(showCompactUI ? 'p-2' : 'p-4')}>
					<div className={cn('grid gap-2', getGridLayout())}>
						{tools.map((tool) => (
							<MenuBox
								key={tool.type}
								selectedTool={_selectedTool}
								toolType={tool.type}
								signers={tool.needsAssignment ? signers : undefined}
								handleSelect={handleSignerSelect}
								title={showCompactUI ? tool.name.split(' ')[0] : tool.name} // Shorten names in compact mode
								tooltip={tool.name}
								onClick={() => handleToolClick(tool.type)}
								onDragStart={onDragStart}
								iconKey={tool.icon}
								isPopoverActive={activePopover === tool.type}
								onPopoverShow={() => handlePopoverShow(tool.type)}
								onPopoverHide={handlePopoverHide}
								onPopoverKeep={handlePopoverKeep}
								onPopoverClose={handlePopoverClose}
								isCompact={showCompactUI}
							/>
						))}
					</div>
				</div>
			</div>

			{/* Signers List */}
			{!showCompactUI && (
				<div className={cn('border-t border-gray-200', showNarrowUI ? 'p-2' : 'p-4')}>
					<h3 className={cn('font-medium text-gray-900 mb-3', showNarrowUI && 'text-sm mb-2')}>
						Signers
					</h3>
					<div className="space-y-1">
						{signers.map((signer) => (
							<div
								key={signer.email}
								className={cn(
									'flex items-center gap-2 p-2 rounded',
									showNarrowUI ? 'text-xs' : 'text-sm',
									'bg-gray-50 text-gray-700 hover:bg-gray-100 cursor-pointer',
								)}
								onClick={() => handleSignerSelect(signer)}
							>
								<div
									className="w-3 h-3 rounded-full flex-shrink-0"
									style={{ backgroundColor: signer.color }}
								/>
								<span className="font-medium truncate">
									{showNarrowUI ? signer.name.split(' ')[0] : signer.name}
								</span>
								{!showNarrowUI && (
									<span className="text-xs text-gray-500 ml-auto">
										{signer.email.split('@')[0]}
									</span>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Compact Signers - Show as icons only */}
			{showCompactUI && signers.length > 0 && (
				<div className="border-t border-gray-200 p-2">
					<div className="flex flex-wrap gap-1">
						{signers.map((signer) => (
							<button
								key={signer.email}
								className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
								style={{ backgroundColor: signer.color }}
								title={`${signer.name} (${signer.email})`}
								onClick={() => handleSignerSelect(signer)}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default EnhancedPalette;
