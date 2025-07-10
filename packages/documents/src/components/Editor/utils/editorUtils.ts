/**
 * Utility functions for the Editor component
 */

import { ViewMode, ComponentType, DocumentComponent, AssignedUser, Position } from '../types';
import { TOOLS_INFO } from '../constants';

/**
 * Convert string viewMode to ViewMode enum
 */
export const getViewModeFromString = (viewMode: string): ViewMode => {
	switch (viewMode) {
		case 'editor':
			return ViewMode.EDITOR;
		case 'input':
			return ViewMode.INPUT;
		case 'sign':
			return ViewMode.SIGN;
		case 'preview':
			return ViewMode.PREVIEW;
		case 'viewer':
			return ViewMode.VIEWER;
		default:
			return ViewMode.EDITOR;
	}
};

/**
 * Calculate responsive width based on client width
 */
export const calculateResponsiveWidth = (clientWidth: number): number => {
	if (clientWidth >= 2400) return clientWidth - clientWidth * 0.75;
	if (clientWidth >= 1600) return clientWidth - clientWidth * 0.5;
	if (clientWidth >= 800) return clientWidth - clientWidth * 0.25;
	return clientWidth - clientWidth * 0.1;
};

/**
 * Generate unique component ID
 */
export const generateComponentId = (): string => {
	return `component-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Get initial position for a component
 */
export const getInitialPosition = (): Position => {
	const baseX = 50;
	const baseY = 50;
	const randomOffset = Math.floor(Math.random() * 100);
	return {
		x: baseX + randomOffset,
		y: baseY + randomOffset,
	};
};

/**
 * Create a new document component
 */
export const createNewComponent = (
	tool: ComponentType,
	pageNumber: number,
	assigned: AssignedUser,
): DocumentComponent => {
	const toolInfo = TOOLS_INFO[tool];
	
	return {
		id: generateComponentId(),
		type: tool,
		pageNumber,
		position: getInitialPosition(),
		size: toolInfo.defaultSize,
		assigned,
		config: toolInfo.defaultConfig,
		created: Date.now(),
	};
};

/**
 * Create neutral system assignment for drawing tools
 */
export const createSystemAssignment = (): AssignedUser => ({
	email: 'system@editor.com',
	name: 'Drawing Tool',
	color: '#666666',
});

/**
 * Check if a tool needs assignment
 */
export const toolNeedsAssignment = (tool: ComponentType): boolean => {
	const toolInfo = TOOLS_INFO[tool];
	return toolInfo?.needsAssignment ?? false;
};