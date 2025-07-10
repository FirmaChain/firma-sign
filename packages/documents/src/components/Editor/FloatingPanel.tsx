import React, {
	useCallback,
	useEffect,
	useRef,
	useState,
	useMemo,
	createContext,
	useContext,
} from 'react';
import { cn } from '../../utils/cn';

export type PanelPosition = 'left' | 'right' | 'top' | 'bottom' | 'floating';

export interface FloatingPanelPosition {
	x: number;
	y: number;
}

export interface PanelDimensions {
	width: number;
	height: number;
	isNarrow: boolean;
	isWide: boolean;
	isCompact: boolean; // for very narrow widths
}

interface PanelDimensionsContextType {
	dimensions: PanelDimensions;
}

const PanelDimensionsContext = createContext<PanelDimensionsContextType | null>(null);

export const usePanelDimensions = (): PanelDimensions => {
	const context = useContext(PanelDimensionsContext);
	if (!context) {
		// Default dimensions if context is not available
		return {
			width: 320,
			height: 600,
			isNarrow: false,
			isWide: true,
			isCompact: false,
		};
	}
	return context.dimensions;
};

export interface FloatingPanelProps {
	id: string;
	title: string;
	children: React.ReactNode;
	position: PanelPosition;
	floatingPosition?: FloatingPanelPosition;
	isPinned: boolean;
	isVisible: boolean;
	onPositionChange?: (position: PanelPosition, floatingPosition?: FloatingPanelPosition) => void;
	onPinnedChange?: (pinned: boolean) => void;
	onVisibilityChange?: (visible: boolean) => void;
	className?: string;
	width?: number;
	height?: number;
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;
}

const PANEL_POSITIONS: { value: PanelPosition; label: string; icon: string }[] = [
	{ value: 'left', label: 'Dock Left', icon: '⬅️' },
	{ value: 'right', label: 'Dock Right', icon: '➡️' },
	{ value: 'top', label: 'Dock Top', icon: '⬆️' },
	{ value: 'bottom', label: 'Dock Bottom', icon: '⬇️' },
	{ value: 'floating', label: 'Float', icon: '🎯' },
];

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
	id,
	title,
	children,
	position,
	floatingPosition = { x: 100, y: 100 },
	isPinned,
	isVisible,
	onPositionChange,
	onPinnedChange,
	onVisibilityChange,
	className,
	width = 320,
	height = 600,
	minWidth = 280,
	minHeight = 400,
	maxWidth = 600,
	maxHeight = 800,
}) => {
	const panelRef = useRef<HTMLDivElement>(null);
	const headerRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const [currentSize, setCurrentSize] = useState({ width, height });
	const [showPositionMenu, setShowPositionMenu] = useState(false);

	// Calculate panel dimensions and breakpoints
	const dimensions: PanelDimensions = useMemo(() => {
		const currentWidth = currentSize.width;
		const currentHeight = currentSize.height;

		return {
			width: currentWidth,
			height: currentHeight,
			isCompact: currentWidth < 220, // Very narrow - single column, minimal UI
			isNarrow: currentWidth < 300, // Narrow - compact layout
			isWide: currentWidth >= 400, // Wide - full layout with extra features
		};
	}, [currentSize]);

	const isFloating = position === 'floating';

	// Handle panel dragging (only when floating and not pinned)
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (!isFloating || isPinned || !headerRef.current) return;

			e.preventDefault();
			e.stopPropagation();

			const rect = panelRef.current?.getBoundingClientRect();
			if (rect) {
				setDragOffset({
					x: e.clientX - rect.left,
					y: e.clientY - rect.top,
				});
			}

			setIsDragging(true);
		},
		[isFloating, isPinned],
	);

	// Handle global mouse events for dragging
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isDragging || !isFloating || !panelRef.current) return;

			// Get parent container bounds for relative positioning
			const parentElement = panelRef.current.offsetParent || document.body;
			const parentRect = parentElement.getBoundingClientRect();

			// Calculate position relative to parent container
			const newX = e.clientX - parentRect.left - dragOffset.x;
			const newY = e.clientY - parentRect.top - dragOffset.y;

			// Keep panel within parent container bounds
			const parentWidth = parentElement.clientWidth;
			const parentHeight = parentElement.clientHeight;

			const constrainedX = Math.max(0, Math.min(parentWidth - currentSize.width, newX));
			const constrainedY = Math.max(0, Math.min(parentHeight - currentSize.height, newY));

			onPositionChange?.(position, { x: constrainedX, y: constrainedY });
		};

		const handleMouseUp = () => {
			setIsDragging(false);
		};

		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);

			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isDragging, dragOffset, currentSize, isFloating, position, onPositionChange]);

	// Calculate floating position based on current docked position
	const getFloatingPositionFromDocked = useCallback(
		(dockedPosition: PanelPosition): FloatingPanelPosition => {
			const { width, height } = currentSize;
			const offset = 20; // Small offset from edges when floating

			// Get parent container dimensions for relative positioning
			const parentElement = panelRef.current?.offsetParent || document.body;
			const parentWidth = parentElement.clientWidth;
			const parentHeight = parentElement.clientHeight;

			switch (dockedPosition) {
				case 'left':
					return {
						x: offset,
						y: Math.max(offset, (parentHeight - height) / 2),
					};
				case 'right':
					return {
						x: Math.max(offset, parentWidth - width - offset),
						y: Math.max(offset, (parentHeight - height) / 2),
					};
				case 'top':
					return {
						x: Math.max(offset, (parentWidth - width) / 2),
						y: offset,
					};
				case 'bottom':
					return {
						x: Math.max(offset, (parentWidth - width) / 2),
						y: Math.max(offset, parentHeight - height - offset),
					};
				default:
					// Fallback to center if position is unknown
					return {
						x: Math.max(offset, (parentWidth - width) / 2),
						y: Math.max(offset, (parentHeight - height) / 2),
					};
			}
		},
		[currentSize],
	);

	// Handle position change
	const handlePositionChange = useCallback(
		(newPosition: PanelPosition) => {
			setShowPositionMenu(false);

			if (newPosition === 'floating' && position !== 'floating') {
				// Moving to floating - calculate position based on current docked position
				const newFloatingPosition = getFloatingPositionFromDocked(position);
				onPositionChange?.(newPosition, newFloatingPosition);
			} else if (newPosition !== 'floating' && position === 'floating') {
				// Moving from floating to docked - just change position (no floating coordinates needed)
				onPositionChange?.(newPosition);
			} else {
				// Other transitions (docked to docked, or floating with existing coordinates)
				onPositionChange?.(newPosition);
			}
		},
		[position, getFloatingPositionFromDocked, onPositionChange],
	);

	// Handle resize
	const handleResizeStart = useCallback(
		(e: React.MouseEvent) => {
			if (!isFloating) return;

			e.preventDefault();
			e.stopPropagation();
			setIsResizing(true);
		},
		[isFloating],
	);

	useEffect(() => {
		const handleResizeMove = (e: MouseEvent) => {
			if (!isResizing || !panelRef.current) return;

			const rect = panelRef.current.getBoundingClientRect();
			const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX - rect.left));
			const newHeight = Math.max(minHeight, Math.min(maxHeight, e.clientY - rect.top));

			setCurrentSize({ width: newWidth, height: newHeight });
		};

		const handleResizeEnd = () => {
			setIsResizing(false);
		};

		if (isResizing) {
			document.addEventListener('mousemove', handleResizeMove);
			document.addEventListener('mouseup', handleResizeEnd);

			return () => {
				document.removeEventListener('mousemove', handleResizeMove);
				document.removeEventListener('mouseup', handleResizeEnd);
			};
		}
	}, [isResizing, minWidth, minHeight, maxWidth, maxHeight]);

	// Get panel styles based on position
	const getPanelStyles = (): React.CSSProperties => {
		const baseStyles: React.CSSProperties = {
			position: 'absolute',
			width: currentSize.width,
			height: currentSize.height,
			zIndex: isDragging ? 1000 : 50,
			transition: isDragging ? 'none' : 'all 0.2s ease',
		};

		if (isFloating) {
			return {
				...baseStyles,
				left: floatingPosition.x,
				top: floatingPosition.y,
			};
		}

		// Docked positions - use absolute positioning relative to parent
		switch (position) {
			case 'left':
				return {
					...baseStyles,
					left: 0,
					top: 0,
					height: '100%',
				};
			case 'right':
				return {
					...baseStyles,
					right: 0,
					top: 0,
					height: '100%',
				};
			case 'top':
				return {
					...baseStyles,
					top: 0,
					left: 0,
					width: '100%',
				};
			case 'bottom':
				return {
					...baseStyles,
					bottom: 0,
					left: 0,
					width: '100%',
				};
			default:
				return baseStyles;
		}
	};

	const getPanelClasses = () => {
		const baseClasses = cn(
			'bg-white shadow-lg flex flex-col',
			isDragging && 'shadow-2xl',
			className,
		);

		if (isFloating) {
			return cn(baseClasses, 'border border-gray-200 rounded-lg overflow-hidden');
		}

		// Docked panels have different border styles
		switch (position) {
			case 'left':
				return cn(baseClasses, 'border-r border-gray-200');
			case 'right':
				return cn(baseClasses, 'border-l border-gray-200');
			case 'top':
				return cn(baseClasses, 'border-b border-gray-200');
			case 'bottom':
				return cn(baseClasses, 'border-t border-gray-200');
			default:
				return cn(baseClasses, 'border border-gray-200 rounded-lg overflow-hidden');
		}
	};

	if (!isVisible) {
		return null;
	}

	return (
		<div ref={panelRef} style={getPanelStyles()} className={getPanelClasses()} data-panel-id={id}>
			{/* Panel Header */}
			<div
				ref={headerRef}
				className={cn(
					'flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50',
					isFloating && !isPinned && 'cursor-move',
					'select-none',
				)}
				onMouseDown={handleMouseDown}
			>
				<div className="flex items-center gap-2">
					<span className="font-medium text-sm text-gray-900">{title}</span>
					{isFloating && (
						<span className="text-xs text-gray-500 bg-blue-100 px-1 rounded">floating</span>
					)}
				</div>

				<div className="flex items-center gap-1">
					{/* Position Menu */}
					<div className="relative">
						<button
							onClick={() => setShowPositionMenu(!showPositionMenu)}
							className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
							title="Change position"
						>
							📍
						</button>

						{showPositionMenu && (
							<div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]">
								{PANEL_POSITIONS.map((pos) => (
									<button
										key={pos.value}
										onClick={() => handlePositionChange(pos.value)}
										className={cn(
											'w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2',
											position === pos.value && 'bg-blue-50 text-blue-700',
											'first:rounded-t-lg last:rounded-b-lg',
										)}
									>
										<span>{pos.icon}</span>
										<span>{pos.label}</span>
									</button>
								))}
							</div>
						)}
					</div>

					{/* Pin/Unpin Button */}
					<button
						onClick={() => onPinnedChange?.(!isPinned)}
						className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
						title={isPinned ? 'Unpin panel' : 'Pin panel'}
					>
						{isPinned ? '📌' : '📎'}
					</button>

					{/* Minimize/Close Button */}
					<button
						onClick={() => onVisibilityChange?.(false)}
						className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
						title="Hide panel"
					>
						✕
					</button>
				</div>
			</div>

			{/* Panel Content */}
			<div className="flex-1 overflow-hidden">
				<PanelDimensionsContext.Provider value={{ dimensions }}>
					{children}
				</PanelDimensionsContext.Provider>
			</div>

			{/* Resize Handle (only for floating panels) */}
			{isFloating && (
				<div
					className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 hover:bg-gray-400"
					onMouseDown={handleResizeStart}
					title="Resize panel"
				>
					<div className="absolute bottom-1 right-1 w-0 h-0 border-l-[6px] border-l-transparent border-b-[6px] border-b-gray-600" />
				</div>
			)}

			{/* Click outside handler for position menu */}
			{showPositionMenu && (
				<div className="fixed inset-0 z-40" onClick={() => setShowPositionMenu(false)} />
			)}
		</div>
	);
};
