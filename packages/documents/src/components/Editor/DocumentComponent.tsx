import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import {
	ComponentProps,
	ViewMode,
	ResizeHandle,
	Position,
	Size,
} from './types';
import { Z_INDEX, GRID, TOOLS_INFO } from './constants';

interface DocumentComponentWrapperProps extends ComponentProps {
	children: React.ReactNode;
	className?: string;
}

const ResizeHandles: React.FC<{
	onStartResize: (handle: ResizeHandle, event: React.MouseEvent) => void;
	canResize: boolean;
}> = ({ onStartResize, canResize }) => {
	if (!canResize) return null;

	const handles: ResizeHandle[] = [
		ResizeHandle.TOP_LEFT,
		ResizeHandle.TOP_RIGHT,
		ResizeHandle.BOTTOM_LEFT,
		ResizeHandle.BOTTOM_RIGHT,
		ResizeHandle.TOP,
		ResizeHandle.RIGHT,
		ResizeHandle.BOTTOM,
		ResizeHandle.LEFT,
	];

	const getHandleClasses = (handle: ResizeHandle) => {
		const baseClasses = 'absolute bg-blue-500 border border-white shadow-sm';

		switch (handle) {
			case ResizeHandle.TOP_LEFT:
				return `${baseClasses} w-2 h-2 -top-1 -left-1 cursor-nw-resize`;
			case ResizeHandle.TOP_RIGHT:
				return `${baseClasses} w-2 h-2 -top-1 -right-1 cursor-ne-resize`;
			case ResizeHandle.BOTTOM_LEFT:
				return `${baseClasses} w-2 h-2 -bottom-1 -left-1 cursor-sw-resize`;
			case ResizeHandle.BOTTOM_RIGHT:
				return `${baseClasses} w-2 h-2 -bottom-1 -right-1 cursor-se-resize`;
			case ResizeHandle.TOP:
				return `${baseClasses} w-2 h-1 -top-0.5 left-1/2 -translate-x-1/2 cursor-n-resize`;
			case ResizeHandle.RIGHT:
				return `${baseClasses} w-1 h-2 -right-0.5 top-1/2 -translate-y-1/2 cursor-e-resize`;
			case ResizeHandle.BOTTOM:
				return `${baseClasses} w-2 h-1 -bottom-0.5 left-1/2 -translate-x-1/2 cursor-s-resize`;
			case ResizeHandle.LEFT:
				return `${baseClasses} w-1 h-2 -left-0.5 top-1/2 -translate-y-1/2 cursor-w-resize`;
			default:
				return baseClasses;
		}
	};

	return (
		<>
			{handles.map((handle) => (
				<div
					key={handle}
					className={getHandleClasses(handle)}
					onMouseDown={(e) => {
						e.stopPropagation();
						onStartResize(handle, e);
					}}
				/>
			))}
		</>
	);
};

export const DocumentComponentWrapper: React.FC<DocumentComponentWrapperProps> = ({
	component,
	isSelected = false,
	isHovered = false,
	viewMode,
	scale,
	onUpdate,
	onSelect,
	onDelete,
	onStartDrag,
	onStartResize,
	children,
	className,
}) => {
	const componentRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isResizing, setIsResizing] = useState(false);
	const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

	const isEditorMode = viewMode === ViewMode.EDITOR;
	const canInteract = isEditorMode;

	// Snap to grid function
	const snapToGrid = useCallback((value: number) => {
		if (!GRID.ENABLED) return value;
		return Math.round(value / GRID.SIZE) * GRID.SIZE;
	}, []);

	// Handle mouse down for dragging
	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			if (!canInteract || isResizing) return;

			e.preventDefault();
			e.stopPropagation();

			onSelect?.(component.id);

			if (e.detail === 2) {
				// Double click - focus for editing
				return;
			}

			const rect = componentRef.current?.getBoundingClientRect();
			if (rect) {
				// Calculate the offset from the mouse position to the component's top-left corner
				const offsetX = e.clientX - rect.left;
				const offsetY = e.clientY - rect.top;
				setDragOffset({ x: offsetX, y: offsetY });
			} else {
				// Fallback to center offset if we can't get the rect
				setDragOffset({ x: component.size.width / 2, y: component.size.height / 2 });
			}

			setIsDragging(true);
			onStartDrag?.(component.id, { x: e.clientX, y: e.clientY });
		},
		[canInteract, isResizing, onSelect, component.id, onStartDrag],
	);

	// Handle resize start
	const handleResizeStart = useCallback(
		(handle: ResizeHandle, e: React.MouseEvent) => {
			if (!canInteract) return;

			e.preventDefault();
			e.stopPropagation();

			setIsResizing(true);
			onStartResize?.(component.id, handle, { x: e.clientX, y: e.clientY }, component.size);
		},
		[canInteract, component.id, component.size, onStartResize],
	);

	// Handle global mouse events
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (isDragging && onUpdate) {
				// Find the specific page container for this component
				const pageContainer = document.querySelector(
					`[data-page-number="${component.pageNumber + 1}"]`,
				);
				if (pageContainer) {
					const pageRect = pageContainer.getBoundingClientRect();

					// Calculate new position based on mouse position minus the drag offset
					// Position is relative to the page container, accounting for the scale
					const newX = (e.clientX - pageRect.left - dragOffset.x) / scale;
					const newY = (e.clientY - pageRect.top - dragOffset.y) / scale;

					// Apply grid snapping
					const snappedX = snapToGrid(newX);
					const snappedY = snapToGrid(newY);

					// Ensure component stays within the page bounds
					const minX = 0;
					const minY = 0;
					// Calculate max bounds based on the scaled page size
					const maxX = Math.max(0, pageRect.width / scale - component.size.width);
					const maxY = Math.max(0, pageRect.height / scale - component.size.height);

					onUpdate({
						...component,
						position: {
							x: Math.max(minX, Math.min(maxX, snappedX)),
							y: Math.max(minY, Math.min(maxY, snappedY)),
						},
					});
				}
			}
		};

		const handleMouseUp = () => {
			setIsDragging(false);
			setIsResizing(false);
		};

		if (isDragging || isResizing) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);

			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	}, [isDragging, isResizing, dragOffset, component, scale, onUpdate, snapToGrid]);

	// Handle keyboard events
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isSelected || !canInteract) return;

			switch (e.key) {
				case 'Delete':
				case 'Backspace':
					e.preventDefault();
					onDelete?.(component.id);
					break;
				case 'ArrowUp':
					e.preventDefault();
					onUpdate?.({
						...component,
						position: {
							...component.position,
							y: Math.max(0, snapToGrid(component.position.y - GRID.SIZE)),
						},
					});
					break;
				case 'ArrowDown':
					e.preventDefault();
					onUpdate?.({
						...component,
						position: {
							...component.position,
							y: snapToGrid(component.position.y + GRID.SIZE),
						},
					});
					break;
				case 'ArrowLeft':
					e.preventDefault();
					onUpdate?.({
						...component,
						position: {
							...component.position,
							x: Math.max(0, snapToGrid(component.position.x - GRID.SIZE)),
						},
					});
					break;
				case 'ArrowRight':
					e.preventDefault();
					onUpdate?.({
						...component,
						position: {
							...component.position,
							x: snapToGrid(component.position.x + GRID.SIZE),
						},
					});
					break;
			}
		};

		if (isSelected) {
			document.addEventListener('keydown', handleKeyDown);
			return () => document.removeEventListener('keydown', handleKeyDown);
		}
	}, [isSelected, canInteract, component, onUpdate, onDelete, snapToGrid]);

	const wrapperStyle: React.CSSProperties = {
		position: 'absolute',
		left: component.position.x * scale,
		top: component.position.y * scale,
		width: component.size.width * scale,
		height: component.size.height * scale,
		zIndex: isSelected ? Z_INDEX.SELECTED_COMPONENT : Z_INDEX.COMPONENT,
		transform: `scale(${scale})`,
		transformOrigin: 'top left',
		transition: isDragging ? 'none' : 'transform 0.1s ease-out',
		opacity: isDragging ? 0.8 : 1,
	};

	return (
		<div
			ref={componentRef}
			style={wrapperStyle}
			className={cn(
				'group',
				canInteract && !isDragging && 'cursor-grab',
				isDragging && 'cursor-grabbing',
				isSelected && 'z-20',
				className,
			)}
			onMouseDown={handleMouseDown}
			data-component-id={component.id}
			data-component-type={component.type}
		>
			{/* Owner name tag */}
			{isEditorMode && (isSelected || isHovered) && component.assigned && (
				<div
					className={cn(
						'absolute -top-5 left-0 z-10',
						'px-1 py-0.5 text-xs text-white font-medium',
						'rounded-t whitespace-nowrap',
						'pointer-events-none select-none',
					)}
					style={{ backgroundColor: component.assigned.color }}
				>
					{component.assigned.name} • P{component.pageNumber + 1}
				</div>
			)}

			{/* Selection border */}
			{isSelected && isEditorMode && (
				<div
					className={cn(
						'absolute inset-0 border-2 pointer-events-none',
						isDragging ? 'border-dashed' : 'border-solid',
					)}
					style={{ borderColor: component.assigned?.color || '#3b82f6' }}
				/>
			)}

			{/* Hover border */}
			{isHovered && !isSelected && isEditorMode && (
				<div className="absolute inset-0 border border-blue-300 pointer-events-none" />
			)}

			{/* Drag shadow */}
			{isDragging && (
				<div className="absolute inset-0 bg-blue-500 bg-opacity-10 pointer-events-none" />
			)}

			{/* Component content */}
			<div className="w-full h-full">{children}</div>

			{/* Resize handles */}
			{isSelected && isEditorMode && (
				<ResizeHandles
					onStartResize={handleResizeStart}
					canResize={TOOLS_INFO[component.type]?.canResize || false}
				/>
			)}
		</div>
	);
};

export default DocumentComponentWrapper;
