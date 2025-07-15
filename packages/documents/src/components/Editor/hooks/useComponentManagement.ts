/**
 * Custom hook for managing document components
 */

import { useCallback, useEffect, useState } from 'react';
import {
	DocumentComponent,
	ComponentType,
	AssignedUser,
	ResizeHandle,
	Position,
	Size,
} from '../types';
import {
	createNewComponent,
	createSystemAssignment,
	toolNeedsAssignment,
} from '../utils/editorUtils';
import { calculateResizeTransform, moveComponentWithKeyboard } from '../utils/componentOperations';

interface UseComponentManagementProps {
	initialComponents: DocumentComponent[];
	selectedPage: number;
	onComponentsChange?: (components: DocumentComponent[]) => void;
}

export const useComponentManagement = ({
	initialComponents,
	selectedPage,
	onComponentsChange,
}: UseComponentManagementProps) => {
	const [documentComponents, setDocumentComponents] =
		useState<DocumentComponent[]>(initialComponents);
	const [selectedComponentId, setSelectedComponentId] = useState<string>('');
	const [hoveredComponentId, setHoveredComponentId] = useState<string>('');
	const [selectedTool, setSelectedTool] = useState<ComponentType | null>(null);

	// Initialize components from props only on mount
	useEffect(() => {
		setDocumentComponents(initialComponents);
	}, []); // Only run on mount

	// Handle prop updates when components array changes externally
	// Only update if we receive new/different components from parent
	useEffect(() => {
		// Skip if initialComponents is empty (parent has no components)
		if (initialComponents.length === 0) return;
		
		// Only update if we actually received different components from parent
		const hasNewComponents = initialComponents.some(comp => 
			!documentComponents.find(existing => existing.id === comp.id)
		);
		
		if (hasNewComponents) {
			setDocumentComponents(initialComponents);
		}
	}, [initialComponents]);

	const updateComponents = useCallback(
		(newComponents: DocumentComponent[]) => {
			setDocumentComponents(newComponents);
			onComponentsChange?.(newComponents);
		},
		[onComponentsChange],
	);

	const handleToolSelect = useCallback(
		(tool: ComponentType) => {
			setSelectedTool(tool);
			setSelectedComponentId('');

			// If this tool doesn't need assignment, create it immediately
			if (!toolNeedsAssignment(tool)) {
				const newComponent = createNewComponent(tool, selectedPage, createSystemAssignment());
				const updatedComponents = [...documentComponents, newComponent];
				updateComponents(updatedComponents);
				setSelectedTool(null);
			}
		},
		[selectedPage, documentComponents, updateComponents],
	);

	const handleUserSelect = useCallback(
		(user: AssignedUser) => {
			if (selectedTool && toolNeedsAssignment(selectedTool)) {
				const newComponent = createNewComponent(selectedTool, selectedPage, user);
				const updatedComponents = [...documentComponents, newComponent];
				updateComponents(updatedComponents);
				setSelectedTool(null);
			}
		},
		[selectedTool, selectedPage, documentComponents, updateComponents],
	);

	const handleComponentUpdate = useCallback(
		(updatedComponent: DocumentComponent) => {
			const updatedComponents = documentComponents.map((comp) =>
				comp.id === updatedComponent.id ? updatedComponent : comp,
			);
			updateComponents(updatedComponents);
		},
		[documentComponents, updateComponents],
	);

	const handleComponentDelete = useCallback(
		(componentId: string) => {
			const updatedComponents = documentComponents.filter((comp) => comp.id !== componentId);
			updateComponents(updatedComponents);
			setSelectedComponentId('');
		},
		[documentComponents, updateComponents],
	);

	const handleComponentSelect = useCallback((componentId: string) => {
		setSelectedComponentId(componentId);
		setSelectedTool(null);
	}, []);

	const handleComponentHover = useCallback((componentId: string | undefined) => {
		setHoveredComponentId(componentId || '');
	}, []);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (!selectedComponentId) return;

			const component = documentComponents.find((c) => c.id === selectedComponentId);
			if (!component) return;

			const moveDistance = e.shiftKey ? 10 : 1;

			switch (e.key) {
				case 'ArrowUp':
				case 'ArrowDown':
				case 'ArrowLeft':
				case 'ArrowRight':
					e.preventDefault();
					const updatedComponent = moveComponentWithKeyboard(component, e.key, moveDistance);
					handleComponentUpdate(updatedComponent);
					break;
				case 'Delete':
				case 'Backspace':
					e.preventDefault();
					handleComponentDelete(selectedComponentId);
					break;
				case 'Escape':
					e.preventDefault();
					setSelectedComponentId('');
					break;
			}
		},
		[selectedComponentId, documentComponents, handleComponentUpdate, handleComponentDelete],
	);

	const handleStartResize = useCallback(
		(componentId: string, handle: ResizeHandle, startPosition: Position, startSize: Size) => {
			const component = documentComponents.find((c) => c.id === componentId);
			if (!component) return;

			const handleMouseMove = (e: MouseEvent) => {
				const deltaX = e.clientX - startPosition.x;
				const deltaY = e.clientY - startPosition.y;

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

				handleComponentUpdate(updatedComponent);
			};

			const handleMouseUp = () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};

			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		},
		[documentComponents, handleComponentUpdate],
	);

	// Add keyboard event listener
	useEffect(() => {
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [handleKeyDown]);

	return {
		documentComponents,
		selectedComponentId,
		hoveredComponentId,
		selectedTool,
		handleToolSelect,
		handleUserSelect,
		handleComponentUpdate,
		handleComponentDelete,
		handleComponentSelect,
		handleComponentHover,
		handleStartResize,
		handleStartDrag: useCallback((componentId: string, _startPosition: Position) => {
			console.log('Drag started for component:', componentId);
		}, []),
	};
};
