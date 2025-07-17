import './styles.css';
import './pdf-worker';

export { default as Editor } from './components/Editor';
export type { EditorProps } from './components/Editor';
export { default as Page } from './components/Editor/Page';
export { default as Palette } from './components/Editor/Palette';
export { EnhancedPalette } from './components/Editor/EnhancedPalette';
export { default as RibbonMenu } from './components/Editor/RibbonMenu';
export { DocumentLayer } from './components/Editor/DocumentLayer';
export { DocumentComponentWrapper } from './components/Editor/DocumentComponent';
export { ComponentFactory } from './components/Editor/ComponentFactory';
export {
	SAMPLE_PDF_BASE64,
	MULTI_PAGE_PDF_BASE64,
	tryPDFSources,
} from './components/Editor/pdf-utils';

// Export types and constants for document components
export type {
	DocumentComponent,
	ViewMode,
	ComponentType,
	AssignedUser,
	Position,
	Size,
	ComponentConfig,
	ComponentProps,
	ToolInfo,
} from './components/Editor/types';
export {
	TOOLS_INFO,
	USER_COLORS,
	DEFAULT_SIZES,
	DEFAULT_CONFIGS,
} from './components/Editor/constants';

// Export individual component types
export * from './components/Editor/Components';
export { ZoomBar } from './components/Editor/Components/ZoomBar';
