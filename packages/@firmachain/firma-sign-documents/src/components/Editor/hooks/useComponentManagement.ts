/**
 * Custom hook for managing document components
 * Provides complete state management for document component operations
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	DocumentComponent,
	ComponentType,
	AssignedUser,
	ResizeHandle,
	Position,
	Size,
} from '../types';
import { createNewComponent, createSystemAssignment } from '../utils/editorUtils';
import { calculateResizeTransform, moveComponentWithKeyboard } from '../utils/componentOperations';

// Constants
const KEYBOARD_MOVE_DISTANCE = {
	NORMAL: 1,
	FAST: 10,
} as const;

// Types
interface UseComponentManagementProps {
	initialComponents: DocumentComponent[];
	selectedPage: number;
	onComponentsChange?: (components: DocumentComponent[]) => void;
}

interface ComponentState {
	components: DocumentComponent[];
	selectedId: string;
	hoveredId: string;
	selectedTool: ComponentType | null;
}

type ComponentUpdater = (components: DocumentComponent[]) => DocumentComponent[];

export const useComponentManagement = ({
	initialComponents,
	selectedPage: _selectedPage,
	onComponentsChange,
}: UseComponentManagementProps) => {
	// State management - grouped for clarity
	const [componentState, setComponentState] = useState<ComponentState>({
		components: initialComponents,
		selectedId: '',
		hoveredId: '',
		selectedTool: null,
	});

	// Refs for stable references
	const onComponentsChangeRef = useRef(onComponentsChange);
	onComponentsChangeRef.current = onComponentsChange;

	// Memoized selectors
	const selectedComponent = useMemo(
		() => componentState.components.find((c) => c.id === componentState.selectedId),
		[componentState.components, componentState.selectedId],
	);

	const hoveredComponent = useMemo(
		() => componentState.components.find((c) => c.id === componentState.hoveredId),
		[componentState.components, componentState.hoveredId],
	);

	// Helper function to update components and notify parent
	const updateComponents = useCallback((updater: ComponentUpdater) => {
		setComponentState((prev) => {
			const updatedComponents = updater(prev.components);
			onComponentsChangeRef.current?.(updatedComponents);
			return { ...prev, components: updatedComponents };
		});
	}, []);

	// Tool selection handlers
	const handleToolSelect = useCallback((tool: ComponentType) => {
		setComponentState((prev) => ({
			...prev,
			selectedTool: tool,
			selectedId: '',
		}));
	}, []);

	const handleUserSelect = useCallback(
		(_user: AssignedUser) => {
			// Store the selected user for the currently selected tool
			// Components are now only created via drag and drop, not on user selection
		},
		[],
	);

	// Component CRUD operations
	const handleComponentDrop = useCallback(
		(toolType: ComponentType, position: Position, pageNumber: number, signer?: AssignedUser) => {
			const assignment = signer || createSystemAssignment();
			const newComponent = createNewComponent(toolType, pageNumber, assignment);
			const updatedComponent = { ...newComponent, position };

			updateComponents((components) => [...components, updatedComponent]);
			
			// Clear selected tool after drop
			setComponentState((prev) => ({ ...prev, selectedTool: null }));
		},
		[updateComponents],
	);

	const handleComponentUpdate = useCallback(
		(updatedComponent: DocumentComponent) => {
			updateComponents((components) =>
				components.map((comp) =>
					comp.id === updatedComponent.id ? updatedComponent : comp,
				),
			);
		},
		[updateComponents],
	);

	const handleComponentDelete = useCallback(
		(componentId: string) => {
			updateComponents((components) => components.filter((comp) => comp.id !== componentId));
			setComponentState((prev) => ({ ...prev, selectedId: '' }));
		},
		[updateComponents],
	);

	// Selection handlers
	const handleComponentSelect = useCallback((componentId: string) => {
		setComponentState((prev) => ({
			...prev,
			selectedId: componentId,
			selectedTool: null,
		}));
	}, []);

	const handleComponentHover = useCallback((componentId: string | undefined) => {
		setComponentState((prev) => ({ ...prev, hoveredId: componentId || '' }));
	}, []);

	// Keyboard interaction handler
	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			const { selectedId } = componentState;
			if (!selectedId) return;

			const moveDistance = e.shiftKey ? KEYBOARD_MOVE_DISTANCE.FAST : KEYBOARD_MOVE_DISTANCE.NORMAL;
			const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
			const isDeleteKey = e.key === 'Delete' || e.key === 'Backspace';
			const isEscapeKey = e.key === 'Escape';

			if (isArrowKey) {
				e.preventDefault();
				updateComponents((components) => {
					const component = components.find((c) => c.id === selectedId);
					if (!component) return components;

					const updatedComponent = moveComponentWithKeyboard(component, e.key, moveDistance);
					return components.map((comp) =>
						comp.id === updatedComponent.id ? updatedComponent : comp,
					);
				});
			} else if (isDeleteKey) {
				e.preventDefault();
				handleComponentDelete(selectedId);
			} else if (isEscapeKey) {
				e.preventDefault();
				setComponentState((prev) => ({ ...prev, selectedId: '' }));
			}
		},
		[componentState, handleComponentDelete, updateComponents],
	);

	// Resize handler with optimized event listeners
	const handleStartResize = useCallback(
		(componentId: string, handle: ResizeHandle, startPosition: Position, startSize: Size) => {
			let animationFrameId: number | null = null;

			const handleMouseMove = (e: MouseEvent) => {
				// Cancel previous animation frame if pending
				if (animationFrameId !== null) {
					cancelAnimationFrame(animationFrameId);
				}

				// Use requestAnimationFrame for smooth resizing
				animationFrameId = requestAnimationFrame(() => {
					const deltaX = e.clientX - startPosition.x;
					const deltaY = e.clientY - startPosition.y;

					updateComponents((components) => {
						const component = components.find((c) => c.id === componentId);
						if (!component) return components;

						const { newSize, newPosition } = calculateResizeTransform(
							component,
							handle,
							deltaX,
							deltaY,
							startSize,
						);

						const updatedComponent = {
							...component,
							size: newSize,
							position: newPosition,
						};

						return components.map((comp) =>
							comp.id === componentId ? updatedComponent : comp,
						);
					});
				});
			};

			const handleMouseUp = () => {
				if (animationFrameId !== null) {
					cancelAnimationFrame(animationFrameId);
				}
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};

			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		},
		[updateComponents],
	);

	// Drag handler placeholder
	const handleStartDrag = useCallback((_componentId: string, _startPosition: Position) => {
		// Drag functionality to be implemented
	}, []);

	// Keyboard event listener effect
	useEffect(() => {
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown]);

	// Return interface - organized by category
	return {
		// State
		documentComponents: componentState.components,
		selectedComponentId: componentState.selectedId,
		hoveredComponentId: componentState.hoveredId,
		selectedTool: componentState.selectedTool,
		
		// Computed values
		selectedComponent,
		hoveredComponent,
		
		// Tool handlers
		handleToolSelect,
		handleUserSelect,
		
		// Component operations
		handleComponentDrop,
		handleComponentUpdate,
		handleComponentDelete,
		
		// Selection handlers
		handleComponentSelect,
		handleComponentHover,
		
		// Interaction handlers
		handleStartResize,
		handleStartDrag,
	};
};
