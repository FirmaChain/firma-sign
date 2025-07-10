/**
 * Component operation utilities
 */

import { DocumentComponent, ResizeHandle, Position, Size } from '../types';

/**
 * Calculate new component position and size during resize
 */
export const calculateResizeTransform = (
	component: DocumentComponent,
	handle: ResizeHandle,
	deltaX: number,
	deltaY: number,
	startSize: Size,
): { newSize: Size; newPosition: Position } => {
	let newSize = { ...startSize };
	let newPosition = { ...component.position };

	switch (handle) {
		case ResizeHandle.TOP_LEFT:
			newSize.width = Math.max(20, startSize.width - deltaX);
			newSize.height = Math.max(20, startSize.height - deltaY);
			newPosition.x = component.position.x + deltaX;
			newPosition.y = component.position.y + deltaY;
			break;
		case ResizeHandle.TOP_RIGHT:
			newSize.width = Math.max(20, startSize.width + deltaX);
			newSize.height = Math.max(20, startSize.height - deltaY);
			newPosition.y = component.position.y + deltaY;
			break;
		case ResizeHandle.BOTTOM_LEFT:
			newSize.width = Math.max(20, startSize.width - deltaX);
			newSize.height = Math.max(20, startSize.height + deltaY);
			newPosition.x = component.position.x + deltaX;
			break;
		case ResizeHandle.BOTTOM_RIGHT:
			newSize.width = Math.max(20, startSize.width + deltaX);
			newSize.height = Math.max(20, startSize.height + deltaY);
			break;
		case ResizeHandle.TOP:
			newSize.height = Math.max(20, startSize.height - deltaY);
			newPosition.y = component.position.y + deltaY;
			break;
		case ResizeHandle.BOTTOM:
			newSize.height = Math.max(20, startSize.height + deltaY);
			break;
		case ResizeHandle.LEFT:
			newSize.width = Math.max(20, startSize.width - deltaX);
			newPosition.x = component.position.x + deltaX;
			break;
		case ResizeHandle.RIGHT:
			newSize.width = Math.max(20, startSize.width + deltaX);
			break;
	}

	return { newSize, newPosition };
};

/**
 * Move component with keyboard
 */
export const moveComponentWithKeyboard = (
	component: DocumentComponent,
	key: string,
	moveDistance: number,
): DocumentComponent => {
	const updatedComponent = { ...component };

	switch (key) {
		case 'ArrowUp':
			updatedComponent.position.y = Math.max(0, component.position.y - moveDistance);
			break;
		case 'ArrowDown':
			updatedComponent.position.y = component.position.y + moveDistance;
			break;
		case 'ArrowLeft':
			updatedComponent.position.x = Math.max(0, component.position.x - moveDistance);
			break;
		case 'ArrowRight':
			updatedComponent.position.x = component.position.x + moveDistance;
			break;
	}

	return updatedComponent;
};