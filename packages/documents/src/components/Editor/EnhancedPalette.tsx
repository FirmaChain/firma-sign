import React, { useCallback, useMemo, useState } from 'react';
import { cn } from '../../utils/cn';
import { ComponentType, ViewMode, AssignedUser } from './types';
import { TOOLS_INFO } from './constants';
import { usePanelDimensions } from './FloatingPanel';

interface PaletteProps {
  signers: AssignedUser[];
  selectedTool?: ComponentType | null;
  onToolSelect?: (tool: ComponentType) => void;
  onUserSelect?: (user: AssignedUser) => void;
  viewMode?: ViewMode;
  className?: string;
  numPages?: number;
  selectedPage?: number;
  onPageSelect?: (page: number) => void;
}

interface MenuBoxProps {
  selectedTool?: ComponentType | null;
  toolType: ComponentType;
  signers?: AssignedUser[];
  handleSelect?: (signer: AssignedUser) => void;
  title: string;
  tooltip: string;
  onClick: (evt: React.MouseEvent) => void;
  iconKey: string;
  disabled?: boolean;
}

const ToolIcons: Record<string, React.ReactNode> = {
  text: <div className="w-4 h-4 border border-gray-400 rounded bg-white flex items-center justify-center text-xs">T</div>,
  signature: <div className="w-4 h-4 text-blue-500">✒️</div>,
  stamp: <div className="w-4 h-4 text-green-500">🏷️</div>,
  checkbox: <div className="w-3 h-3 border border-gray-400 rounded bg-white"></div>,
  checkmark: <div className="w-4 h-4 text-blue-500">✓</div>,
  input: <div className="w-4 h-4 border border-gray-400 rounded bg-white"></div>,
  calendar: <div className="w-4 h-4 text-blue-500">📅</div>,
  extra: <div className="w-4 h-4 text-purple-500">📄</div>,
  rectangle: <div className="w-4 h-3 border border-gray-400 rounded bg-white"></div>,
  circle: <div className="w-4 h-4 border border-gray-400 rounded-full bg-white"></div>,
  line: <div className="w-4 h-0.5 bg-gray-400"></div>
};

const MenuBox: React.FC<MenuBoxProps> = ({
  selectedTool,
  toolType,
  signers,
  handleSelect,
  title,
  tooltip,
  onClick,
  iconKey,
  disabled = false
}) => {
  const isSelected = selectedTool === toolType;
  const toolInfo = TOOLS_INFO[toolType];
  const dimensions = usePanelDimensions();
  
  return (
    <div className="relative w-full">
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg border transition-all duration-200',
          'flex items-center justify-center',
          'font-medium',
          // Responsive sizing
          dimensions.isCompact ? 'p-2 flex-col gap-1' : 'p-3 flex-col gap-2',
          dimensions.isCompact ? 'text-xs' : 'text-sm',
          isSelected
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title={tooltip}
      >
        <div className={cn(
          'flex items-center justify-center',
          dimensions.isCompact ? 'w-4 h-4' : 'w-6 h-6'
        )}>
          {ToolIcons[iconKey] || <div className="w-4 h-4 bg-gray-400 rounded" />}
        </div>
        <span className={cn(
          'leading-tight text-center',
          dimensions.isCompact ? 'text-xs' : 'text-xs'
        )}>
          {title}
        </span>
        {/* Indicator for neutral tools */}
        {!toolInfo.needsAssignment && (
          <div className={cn(
            'absolute bg-green-500 rounded-full',
            dimensions.isCompact ? '-top-0.5 -right-0.5 w-1.5 h-1.5' : '-top-1 -right-1 w-2 h-2'
          )} title="Drawing tool - no assignment needed" />
        )}
      </button>
      
      {/* Dropdown/Popover for tool options */}
      {isSelected && !dimensions.isCompact && (
        <div className={cn(
          'absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50',
          dimensions.isNarrow ? 'w-48' : 'w-64'
        )}>
          <div className="p-3">
            <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
            
            {/* Signer list for tools that need assignment */}
            {signers && signers.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-gray-500 mb-2">Assign to:</div>
                {signers.map((signer) => (
                  <button
                    key={signer.email}
                    onClick={() => handleSelect?.(signer)}
                    className={cn(
                      'w-full p-2 text-left rounded border transition-colors',
                      'flex items-center gap-2',
                      'hover:bg-gray-50'
                    )}
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: signer.color }}
                    />
                    <span className="text-sm">{signer.name}</span>
                    <span className="text-xs text-gray-500">({signer.email})</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* Tool info */}
            {toolInfo && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-2">Info:</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Size: {toolInfo.defaultSize.width}×{toolInfo.defaultSize.height}</div>
                  <div>Resizable: {toolInfo.canResize ? 'Yes' : 'No'}</div>
                  <div>Needs assignment: {toolInfo.needsAssignment ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const EnhancedPalette: React.FC<PaletteProps> = ({ 
  signers, 
  selectedTool: _selectedTool, 
  onToolSelect, 
  onUserSelect, 
  viewMode = ViewMode.EDITOR, 
  className,
  numPages = 1,
  selectedPage = 0,
  onPageSelect
}) => {
  const [expandedTool, setExpandedTool] = useState<ComponentType | null>(null);
  const dimensions = usePanelDimensions();
  
  const tools = useMemo(() => {
    if (viewMode !== ViewMode.EDITOR) return [];
    
    return [
      TOOLS_INFO[ComponentType.TEXT],
      TOOLS_INFO[ComponentType.SIGNATURE],
      TOOLS_INFO[ComponentType.STAMP],
      TOOLS_INFO[ComponentType.CHECKBOX],
      TOOLS_INFO[ComponentType.CHECKMARK],
      TOOLS_INFO[ComponentType.INPUT_FIELD],
      TOOLS_INFO[ComponentType.DATE],
      TOOLS_INFO[ComponentType.EXTRA],
      TOOLS_INFO[ComponentType.RECTANGLE],
      TOOLS_INFO[ComponentType.CIRCLE],
      TOOLS_INFO[ComponentType.LINE]
    ];
  }, [viewMode]);

  const handleToolClick = useCallback((toolType: ComponentType) => {
    if (onToolSelect) {
      onToolSelect(toolType);
    }
    setExpandedTool(expandedTool === toolType ? null : toolType);
  }, [onToolSelect, expandedTool]);

  const handleSignerSelect = useCallback((signer: AssignedUser) => {
    if (onUserSelect) {
      onUserSelect(signer);
    }
    setExpandedTool(null);
  }, [onUserSelect]);

  if (viewMode !== ViewMode.EDITOR) {
    return null;
  }

  // Determine grid layout based on panel width
  const getGridLayout = () => {
    if (dimensions.isCompact) return 'grid-cols-1'; // Single column for very narrow
    if (dimensions.isNarrow) return 'grid-cols-2';  // Two columns for narrow
    return 'grid-cols-2'; // Default two columns
  };

  // Determine if we should show compact UI elements
  const showCompactUI = dimensions.isCompact;
  const showNarrowUI = dimensions.isNarrow;

  return (
    <div className={cn(
      'w-full h-full bg-gray-50',
      'flex flex-col',
      className
    )}>
      {/* Header */}
      <div className={cn(
        'border-b border-gray-200',
        showCompactUI ? 'p-2' : 'p-4'
      )}>
        <h2 className={cn(
          'font-semibold text-gray-900',
          showCompactUI ? 'text-sm' : 'text-base'
        )}>
          {showCompactUI ? 'Tools' : 'Document Tools'}
        </h2>
        
        {/* Page Selector for Multi-page Documents */}
        {numPages > 1 && (
          <div className={cn('mt-3', showCompactUI && 'mt-2')}>
            {!showCompactUI && (
              <label className="text-sm font-medium text-gray-700">Place on Page:</label>
            )}
            <select
              value={selectedPage}
              onChange={(e) => onPageSelect?.(parseInt(e.target.value))}
              className={cn(
                'rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500',
                showCompactUI ? 'mt-0 w-full text-xs' : 'mt-1 block w-full sm:text-sm'
              )}
            >
              {Array.from({ length: numPages }, (_, i) => (
                <option key={i} value={i}>
                  {showCompactUI ? `P${i + 1}` : `Page ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Tools Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn(showCompactUI ? 'p-2' : 'p-4')}>
          <div className={cn('grid gap-2', getGridLayout())}>
            {tools.map((tool) => (
              <MenuBox
                key={tool.type}
                selectedTool={expandedTool}
                toolType={tool.type}
                signers={tool.needsAssignment ? signers : undefined}
                handleSelect={handleSignerSelect}
                title={showCompactUI ? tool.name.split(' ')[0] : tool.name} // Shorten names in compact mode
                tooltip={tool.name}
                onClick={() => handleToolClick(tool.type)}
                iconKey={tool.icon}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Signers List */}
      {!showCompactUI && (
        <div className={cn(
          'border-t border-gray-200',
          showNarrowUI ? 'p-2' : 'p-4'
        )}>
          <h3 className={cn(
            'font-medium text-gray-900 mb-3',
            showNarrowUI && 'text-sm mb-2'
          )}>
            Signers
          </h3>
          <div className="space-y-1">
            {signers.map((signer) => (
              <div
                key={signer.email}
                className={cn(
                  'flex items-center gap-2 p-2 rounded',
                  showNarrowUI ? 'text-xs' : 'text-sm',
                  'bg-gray-50 text-gray-700 hover:bg-gray-100 cursor-pointer'
                )}
                onClick={() => handleSignerSelect(signer)}
              >
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: signer.color }}
                />
                <span className="font-medium truncate">
                  {showNarrowUI ? signer.name.split(' ')[0] : signer.name}
                </span>
                {!showNarrowUI && (
                  <span className="text-xs text-gray-500 ml-auto">
                    {signer.email.split('@')[0]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Compact Signers - Show as icons only */}
      {showCompactUI && signers.length > 0 && (
        <div className="border-t border-gray-200 p-2">
          <div className="flex flex-wrap gap-1">
            {signers.map((signer) => (
              <button
                key={signer.email}
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: signer.color }}
                title={`${signer.name} (${signer.email})`}
                onClick={() => handleSignerSelect(signer)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPalette;