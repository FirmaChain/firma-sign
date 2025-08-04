import { ComponentType, ToolInfo, Size, ComponentConfig } from './types';

// Default sizes for different component types
export const DEFAULT_SIZES: Record<ComponentType, Size> = {
  [ComponentType.TEXT]: { width: 120, height: 30 },
  [ComponentType.SIGNATURE]: { width: 150, height: 60 },
  [ComponentType.STAMP]: { width: 80, height: 80 },
  [ComponentType.CHECKBOX]: { width: 20, height: 20 },
  [ComponentType.CHECKMARK]: { width: 20, height: 20 },
  [ComponentType.INPUT_FIELD]: { width: 120, height: 30 },
  [ComponentType.DATE]: { width: 100, height: 30 },
  [ComponentType.EXTRA]: { width: 100, height: 30 },
  [ComponentType.RECTANGLE]: { width: 100, height: 60 },
  [ComponentType.CIRCLE]: { width: 60, height: 60 },
  [ComponentType.LINE]: { width: 100, height: 2 },
  [ComponentType.IMAGE]: { width: 100, height: 100 }
};

// Default configurations for different component types
export const DEFAULT_CONFIGS: Record<ComponentType, ComponentConfig> = {
  [ComponentType.TEXT]: {
    fontSize: 14,
    fontFamily: 'Arial, sans-serif',
    color: '#000000',
    backgroundColor: 'transparent',
    placeholder: 'Text',
    multiline: false
  },
  [ComponentType.SIGNATURE]: {
    required: true,
    backgroundColor: '#f8f9ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
    placeholder: 'Signature'
  },
  [ComponentType.STAMP]: {
    required: true,
    backgroundColor: '#f8f9ff',
    borderColor: '#3b82f6',
    borderWidth: 1,
    placeholder: 'Stamp'
  },
  [ComponentType.CHECKBOX]: {
    backgroundColor: 'transparent',
    borderColor: '#666666',
    borderWidth: 1
  },
  [ComponentType.CHECKMARK]: {
    backgroundColor: 'transparent',
    color: '#3b82f6'
  },
  [ComponentType.INPUT_FIELD]: {
    fontSize: 14,
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderWidth: 1,
    placeholder: 'Input field',
    maxLength: 100
  },
  [ComponentType.DATE]: {
    fontSize: 14,
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderWidth: 1,
    placeholder: 'MM/DD/YYYY'
  },
  [ComponentType.EXTRA]: {
    fontSize: 14,
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderWidth: 1,
    placeholder: 'Extra data'
  },
  [ComponentType.RECTANGLE]: {
    backgroundColor: 'transparent',
    borderColor: '#666666',
    borderWidth: 2
  },
  [ComponentType.CIRCLE]: {
    backgroundColor: 'transparent',
    borderColor: '#666666',
    borderWidth: 2
  },
  [ComponentType.LINE]: {
    backgroundColor: '#666666',
    borderWidth: 0
  },
  [ComponentType.IMAGE]: {
    backgroundColor: 'transparent',
    borderColor: '#d1d5db',
    borderWidth: 1
  }
};

// Tool information for the palette
export const TOOLS_INFO: Record<ComponentType, ToolInfo> = {
  [ComponentType.TEXT]: {
    type: ComponentType.TEXT,
    name: 'Text',
    icon: 'text',
    defaultSize: DEFAULT_SIZES[ComponentType.TEXT],
    defaultConfig: DEFAULT_CONFIGS[ComponentType.TEXT],
    canResize: true,
    canRotate: false,
    needsAssignment: false
  },
  [ComponentType.SIGNATURE]: {
    type: ComponentType.SIGNATURE,
    name: 'Signature',
    icon: 'signature',
    defaultSize: DEFAULT_SIZES[ComponentType.SIGNATURE],
    defaultConfig: DEFAULT_CONFIGS[ComponentType.SIGNATURE],
    canResize: true,
    canRotate: false,
    needsAssignment: true
  },
  [ComponentType.STAMP]: {
    type: ComponentType.STAMP,
    name: 'Stamp',
    icon: 'stamp',
    defaultSize: DEFAULT_SIZES[ComponentType.STAMP],
    defaultConfig: DEFAULT_CONFIGS[ComponentType.STAMP],
    canResize: true,
    canRotate: false,
    needsAssignment: true
  },
  [ComponentType.CHECKBOX]: {
    type: ComponentType.CHECKBOX,
    name: 'Checkbox',
    icon: 'checkbox',
    defaultSize: DEFAULT_SIZES[ComponentType.CHECKBOX],
    defaultConfig: DEFAULT_CONFIGS[ComponentType.CHECKBOX],
    canResize: false,
    canRotate: false,
    needsAssignment: true
  },
  [ComponentType.CHECKMARK]: {
    type: ComponentType.CHECKMARK,
    name: 'Checkmark',
    icon: 'checkmark',
    defaultSize: DEFAULT_SIZES[ComponentType.CHECKMARK],
    defaultConfig: DEFAULT_CONFIGS[ComponentType.CHECKMARK],
    canResize: false,
    canRotate: false,
    needsAssignment: true
  },
  [ComponentType.INPUT_FIELD]: {
    type: ComponentType.INPUT_FIELD,
    name: 'Input Field',
    icon: 'input',
    defaultSize: DEFAULT_SIZES[ComponentType.INPUT_FIELD],
    defaultConfig: DEFAULT_CONFIGS[ComponentType.INPUT_FIELD],
    canResize: true,
    canRotate: false,
    needsAssignment: true
  },
  [ComponentType.DATE]: {
    type: ComponentType.DATE,
    name: 'Date',
    icon: 'calendar',
    defaultSize: DEFAULT_SIZES[ComponentType.DATE],
    defaultConfig: DEFAULT_CONFIGS[ComponentType.DATE],
    canResize: true,
    canRotate: false,
    needsAssignment: true
  },
  [ComponentType.EXTRA]: {
    type: ComponentType.EXTRA,
    name: 'Extra Data',
    icon: 'extra',
    defaultSize: DEFAULT_SIZES[ComponentType.EXTRA],
    defaultConfig: DEFAULT_CONFIGS[ComponentType.EXTRA],
    canResize: true,
    canRotate: false,
    needsAssignment: true
  },
  [ComponentType.RECTANGLE]: {
    type: ComponentType.RECTANGLE,
    name: 'Rectangle',
    icon: 'rectangle',
    defaultSize: DEFAULT_SIZES[ComponentType.RECTANGLE],
    defaultConfig: DEFAULT_CONFIGS[ComponentType.RECTANGLE],
    canResize: true,
    canRotate: false,
    needsAssignment: false
  },
  [ComponentType.CIRCLE]: {
    type: ComponentType.CIRCLE,
    name: 'Circle',
    icon: 'circle',
    defaultSize: DEFAULT_SIZES[ComponentType.CIRCLE],
    defaultConfig: DEFAULT_CONFIGS[ComponentType.CIRCLE],
    canResize: true,
    canRotate: false,
    needsAssignment: false
  },
  [ComponentType.LINE]: {
    type: ComponentType.LINE,
    name: 'Line',
    icon: 'line',
    defaultSize: DEFAULT_SIZES[ComponentType.LINE],
    defaultConfig: DEFAULT_CONFIGS[ComponentType.LINE],
    canResize: true,
    canRotate: true,
    needsAssignment: false
  },
  [ComponentType.IMAGE]: {
    type: ComponentType.IMAGE,
    name: 'Image',
    icon: 'image',
    defaultSize: DEFAULT_SIZES[ComponentType.IMAGE],
    defaultConfig: DEFAULT_CONFIGS[ComponentType.IMAGE],
    canResize: true,
    canRotate: false,
    needsAssignment: false
  }
};

// Colors for different users
export const USER_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1'  // indigo
];

// Z-index values
export const Z_INDEX = {
  COMPONENT: 10,
  SELECTED_COMPONENT: 20,
  RESIZE_HANDLES: 30,
  CONTEXT_MENU: 40,
  MODAL: 50
};

// Grid snap settings
export const GRID = {
  SIZE: 10,
  ENABLED: true
};

// Minimum component sizes
export const MIN_SIZE = {
  WIDTH: 10,
  HEIGHT: 10
};

// Maximum component sizes
export const MAX_SIZE = {
  WIDTH: 500,
  HEIGHT: 300
};