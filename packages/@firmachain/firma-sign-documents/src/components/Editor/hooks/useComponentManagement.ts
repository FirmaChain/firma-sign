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
} from '../utils/editorUtils';
import { calculateResizeTransform, moveComponentWithKeyboard } from '../utils/componentOperations';

interface UseComponentManagementProps {
	initialComponents: DocumentComponent[];
	selectedPage: number;
	onComponentsChange?: (components: DocumentComponent[]) => void;
}

export const useComponentManagement = ({
	initialComponents,
	selectedPage: _selectedPage,
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
	}, [initialComponents]); // Only run on mount

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
	}, [initialComponents, documentComponents]);

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
			// Note: Components are now only created via drag and drop, not on click
		},
		[],
	);

	const handleUserSelect = useCallback(
		(user: AssignedUser) => {
			// Store the selected user for the currently selected tool
			// Components are now only created via drag and drop, not on user selection
			console.log('User selected for tool:', selectedTool, user);
		},
		[selectedTool],
	);

	const handleComponentDrop = useCallback(
		(toolType: ComponentType, position: Position, pageNumber: number, signer?: AssignedUser) => {
			const assignment = signer || createSystemAssignment();
			const newComponent = createNewComponent(toolType, pageNumber, assignment);
			
			// Update component position to drop location
			const updatedComponent = {
				...newComponent,
				position: position,
			};
			
			const updatedComponents = [...documentComponents, updatedComponent];
			updateComponents(updatedComponents);
			
			// Clear selected tool if any
			setSelectedTool(null);
		},
		[documentComponents, updateComponents],
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
				case 'ArrowRight': {
					e.preventDefault();
					const updatedComponent = moveComponentWithKeyboard(component, e.key, moveDistance);
					handleComponentUpdate(updatedComponent);
					break;
				}
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
		handleComponentDrop,
		handleStartDrag: useCallback((componentId: string, _startPosition: Position) => {
			console.log('Drag started for component:', componentId);
		}, []),
	};
};
