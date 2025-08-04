import React, { useCallback, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { DocumentComponent, ViewMode, ComponentType, Position, Size, ResizeHandle } from './types';
import { ComponentFactory } from './ComponentFactory';
import { DocumentComponentWrapper } from './DocumentComponent';

interface DocumentLayerProps {
	pageNumber: number;
	components: DocumentComponent[];
	selectedComponentId?: string;
	hoveredComponentId?: string;
	viewMode: ViewMode;
	scale: number;
	onComponentUpdate?: (component: DocumentComponent) => void;
	onComponentSelect?: (componentId: string) => void;
	onComponentDelete?: (componentId: string) => void;
	onComponentHover?: (componentId: string | undefined) => void;
	onStartDrag?: (componentId: string, startPosition: Position) => void;
	onStartResize?: (
		componentId: string,
		handle: ResizeHandle,
		startPosition: Position,
		startSize: Size,
	) => void;
	className?: string;
}

export const DocumentLayer: React.FC<DocumentLayerProps> = ({
	pageNumber,
	components,
	selectedComponentId,
	hoveredComponentId,
	viewMode,
	scale,
	onComponentUpdate,
	onComponentSelect,
	onComponentDelete,
	onComponentHover,
	onStartDrag,
	onStartResize,
	className,
}) => {
	// Filter components for this page
	const pageComponents = useMemo(() => {
		return components.filter((component) => component.pageNumber === pageNumber);
	}, [components, pageNumber]);

	// Sort components by creation time (z-index)
	const sortedComponents = useMemo(() => {
		return [...pageComponents].sort((a, b) => {
			const aTime = a.created || 0;
			const bTime = b.created || 0;
			return aTime - bTime;
		});
	}, [pageComponents]);

	// Handle component mouse events
	const handleMouseEnter = useCallback(
		(componentId: string) => {
			onComponentHover?.(componentId);
		},
		[onComponentHover],
	);

	const handleMouseLeave = useCallback(() => {
		onComponentHover?.(undefined);
	}, [onComponentHover]);

	// Handle component clicks outside of the wrapper
	const handleLayerClick = useCallback(
		(e: React.MouseEvent) => {
			if (e.target === e.currentTarget) {
				onComponentSelect?.(''); // Deselect all components
			}
		},
		[onComponentSelect],
	);

	return (
		<div
			className={cn('absolute inset-0 pointer-events-none', 'select-none', className)}
			onClick={handleLayerClick}
		>
			{sortedComponents.map((component) => {
				const isSelected = selectedComponentId === component.id;
				const isHovered = hoveredComponentId === component.id;

				return (
					<div
						key={component.id}
						className="pointer-events-auto"
						onMouseEnter={() => handleMouseEnter(component.id)}
						onMouseLeave={handleMouseLeave}
					>
						<DocumentComponentWrapper
							component={component}
							isSelected={isSelected}
							isHovered={isHovered}
							viewMode={viewMode}
							scale={scale}
							onUpdate={onComponentUpdate}
							onSelect={onComponentSelect}
							onDelete={onComponentDelete}
							onStartDrag={onStartDrag}
							onStartResize={onStartResize}
						>
							<ComponentFactory
								component={component}
								isSelected={isSelected}
								isHovered={isHovered}
								viewMode={viewMode}
								scale={scale}
								onUpdate={onComponentUpdate}
								onSelect={onComponentSelect}
								onDelete={onComponentDelete}
								onStartDrag={onStartDrag}
								onStartResize={onStartResize}
							/>
						</DocumentComponentWrapper>
					</div>
				);
			})}
		</div>
	);
};
