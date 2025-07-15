// Document component types and interfaces

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ComponentConfig {
  required?: boolean;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  readonly?: boolean;
  fixed?: boolean;
}

export interface AssignedUser {
  userId?: string;
  email: string;
  name: string;
  color: string;
}

export interface DocumentComponent {
  id: string;
  type: ComponentType;
  pageNumber: number;
  position: Position;
  size: Size;
  assigned: AssignedUser;
  value?: string;
  config: ComponentConfig;
  groupId?: string;
  extra?: any;
  created?: number;
  modified?: number;
}

export enum ComponentType {
  TEXT = 'text',
  SIGNATURE = 'signature',
  STAMP = 'stamp',
  CHECKBOX = 'checkbox',
  CHECKMARK = 'checkmark',
  INPUT_FIELD = 'inputField',
  DATE = 'date',
  EXTRA = 'extra',
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  LINE = 'line',
  IMAGE = 'image'
}

export interface ComponentGroup {
  id: string;
  name: string;
  config: {
    minimumRequired?: number;
    maximumAllowed?: number;
  };
  components: string[]; // Component IDs
}

export enum ViewMode {
  EDITOR = 'editor',    // Design and layout components
  FORM = 'form',        // Fill out form fields and signatures  
  PREVIEW = 'preview'   // Read-only view of completed document
}

export enum ToolMode {
  DRAW = 'draw',
  RESIZE = 'resize',
  SELECT = 'select',
  SCROLL = 'scroll'
}

export interface EditorState {
  components: Record<string, DocumentComponent>;
  componentGroups: Record<string, ComponentGroup>;
  selectedComponent?: string;
  hoveredComponent?: string;
  currentTool?: ComponentType;
  viewMode: ViewMode;
  toolMode: ToolMode;
  scale: number;
  isDragging: boolean;
  isResizing: boolean;
}

export interface DragState {
  isDragging: boolean;
  startPosition: Position;
  currentPosition: Position;
  componentId?: string;
}

export interface ResizeState {
  isResizing: boolean;
  startSize: Size;
  startPosition: Position;
  currentSize: Size;
  componentId?: string;
  handle: ResizeHandle;
}

export enum ResizeHandle {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
  TOP = 'top',
  RIGHT = 'right',
  BOTTOM = 'bottom',
  LEFT = 'left'
}

export interface ComponentProps {
  component: DocumentComponent;
  isSelected?: boolean;
  isHovered?: boolean;
  isFocused?: boolean;
  viewMode: ViewMode;
  scale: number;
  onUpdate?: (component: DocumentComponent) => void;
  onSelect?: (componentId: string) => void;
  onDelete?: (componentId: string) => void;
  onStartDrag?: (componentId: string, startPosition: Position) => void;
  onStartResize?: (componentId: string, handle: ResizeHandle, startPosition: Position, startSize: Size) => void;
}

export interface ToolInfo {
  type: ComponentType;
  name: string;
  icon: string;
  defaultSize: Size;
  defaultConfig: ComponentConfig;
  canResize: boolean;
  canRotate: boolean;
  needsAssignment: boolean;
}

export interface PaletteProps {
  tools: ToolInfo[];
  selectedTool?: ComponentType;
  onToolSelect: (tool: ComponentType) => void;
  assignedUsers: AssignedUser[];
  onUserSelect: (user: AssignedUser) => void;
}