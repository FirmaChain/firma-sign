import React, { useCallback, useMemo, useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { DocumentComponent, ComponentType, ViewMode, AssignedUser } from './types';
import { TOOLS_INFO } from './constants';

interface ComponentsPanelProps {
  components: DocumentComponent[];
  selectedComponentId?: string;
  viewMode: ViewMode;
  numPages: number;
  onComponentSelect?: (componentId: string) => void;
  onComponentUpdate?: (component: DocumentComponent) => void;
  onComponentDelete?: (componentId: string) => void;
  onComponentsChange?: (components: DocumentComponent[]) => void;
  className?: string;
}

interface ComponentItemProps {
  component: DocumentComponent;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (component: DocumentComponent) => void;
}

const ComponentTypeIcon: React.FC<{ type: ComponentType }> = ({ type }) => {
  const iconMap: Record<ComponentType, string> = {
    [ComponentType.TEXT]: '📝',
    [ComponentType.SIGNATURE]: '✒️',
    [ComponentType.STAMP]: '🏷️',
    [ComponentType.CHECKBOX]: '☐',
    [ComponentType.CHECKMARK]: '✓',
    [ComponentType.INPUT_FIELD]: '📄',
    [ComponentType.DATE]: '📅',
    [ComponentType.EXTRA]: '📎',
    [ComponentType.RECTANGLE]: '◻️',
    [ComponentType.CIRCLE]: '○',
    [ComponentType.LINE]: '—'
  };

  return (
    <span className="text-lg">
      {iconMap[type] || '❓'}
    </span>
  );
};

const ComponentItem: React.FC<ComponentItemProps> = ({
  component,
  isSelected,
  onSelect,
  onDelete,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(component.value || '');

  const toolInfo = TOOLS_INFO[component.type];

  const handleSaveEdit = useCallback(() => {
    onUpdate({
      ...component,
      value: editValue
    });
    setIsEditing(false);
  }, [component, editValue, onUpdate]);

  const handleCancelEdit = useCallback(() => {
    setEditValue(component.value || '');
    setIsEditing(false);
  }, [component.value]);

  return (
    <div
      className={cn(
        'border rounded-lg p-3 transition-all duration-200 cursor-pointer',
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      )}
      onClick={() => onSelect(component.id)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ComponentTypeIcon type={component.type} />
          <div>
            <div className="font-medium text-sm text-gray-900">
              {toolInfo?.name || component.type}
            </div>
            <div className="text-xs text-gray-500">
              Page {component.pageNumber + 1}
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(component.id);
          }}
          className="text-red-500 hover:text-red-700 text-sm"
          title="Delete component"
        >
          🗑️
        </button>
      </div>

      {/* Assigned User */}
      {component.assigned && (
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: component.assigned.color }}
          />
          <span className="text-xs text-gray-600">
            {component.assigned.name}
          </span>
        </div>
      )}

      {/* Position and Size */}
      <div className="text-xs text-gray-500 mb-2">
        <div>Position: ({Math.round(component.position.x)}, {Math.round(component.position.y)})</div>
        <div>Size: {Math.round(component.size.width)} × {Math.round(component.size.height)}</div>
      </div>

      {/* Value (if editable) */}
      {(component.type === ComponentType.TEXT || component.type === ComponentType.INPUT_FIELD) && (
        <div className="mt-2">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="Enter value..."
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveEdit();
                  }}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelEdit();
                  }}
                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="text-xs text-gray-700 bg-gray-100 p-2 rounded cursor-text"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              title="Click to edit"
            >
              {component.value || 'Click to edit...'}
            </div>
          )}
        </div>
      )}

      {/* Checkbox value */}
      {component.type === ComponentType.CHECKBOX && (
        <div className="mt-2">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={component.value === 'true' || component.value === true}
              onChange={(e) => {
                e.stopPropagation();
                onUpdate({
                  ...component,
                  value: e.target.checked
                });
              }}
              className="rounded"
            />
            <span>Checked</span>
          </label>
        </div>
      )}

      {/* Required indicator */}
      {component.config?.required && (
        <div className="mt-2">
          <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
            Required
          </span>
        </div>
      )}
    </div>
  );
};

export const ComponentsPanel: React.FC<ComponentsPanelProps> = ({
  components,
  selectedComponentId,
  viewMode,
  numPages,
  onComponentSelect,
  onComponentUpdate,
  onComponentDelete,
  onComponentsChange,
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ComponentType | 'all'>('all');
  const [filterPage, setFilterPage] = useState<number | 'all'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string | 'all'>('all');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get unique assignees
  const assignees = useMemo(() => {
    const uniqueAssignees = new Map<string, AssignedUser>();
    components.forEach(comp => {
      if (comp.assigned) {
        uniqueAssignees.set(comp.assigned.email, comp.assigned);
      }
    });
    return Array.from(uniqueAssignees.values());
  }, [components]);

  // Filter and search components
  const filteredComponents = useMemo(() => {
    return components.filter(component => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          component.type.toLowerCase().includes(searchLower) ||
          (component.value && component.value.toString().toLowerCase().includes(searchLower)) ||
          (component.assigned?.name.toLowerCase().includes(searchLower)) ||
          (TOOLS_INFO[component.type]?.name.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filterType !== 'all' && component.type !== filterType) {
        return false;
      }

      // Page filter
      if (filterPage !== 'all' && component.pageNumber !== filterPage) {
        return false;
      }

      // Assignee filter
      if (filterAssignee !== 'all' && component.assigned?.email !== filterAssignee) {
        return false;
      }

      return true;
    });
  }, [components, searchTerm, filterType, filterPage, filterAssignee]);

  // Sort components by page, then by creation time
  const sortedComponents = useMemo(() => {
    return [...filteredComponents].sort((a, b) => {
      if (a.pageNumber !== b.pageNumber) {
        return a.pageNumber - b.pageNumber;
      }
      return (a.created || 0) - (b.created || 0);
    });
  }, [filteredComponents]);

  // Get component statistics
  const stats = useMemo(() => {
    const total = components.length;
    const required = components.filter(c => c.config?.required).length;
    const completed = components.filter(c => c.value).length;
    const byPage = new Map<number, number>();
    
    components.forEach(comp => {
      byPage.set(comp.pageNumber, (byPage.get(comp.pageNumber) || 0) + 1);
    });

    return { total, required, completed, byPage };
  }, [components]);

  const handleComponentSelect = useCallback((componentId: string) => {
    onComponentSelect?.(componentId);
  }, [onComponentSelect]);

  const handleComponentDelete = useCallback((componentId: string) => {
    onComponentDelete?.(componentId);
  }, [onComponentDelete]);

  const handleComponentUpdate = useCallback((component: DocumentComponent) => {
    onComponentUpdate?.(component);
  }, [onComponentUpdate]);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setFilterType('all');
    setFilterPage('all');
    setFilterAssignee('all');
  }, []);

  // Import functionality
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const validateComponentData = useCallback((data: any): data is DocumentComponent[] => {
    if (!Array.isArray(data)) {
      return false;
    }

    return data.every((item: any) => {
      return (
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.type === 'string' &&
        typeof item.pageNumber === 'number' &&
        typeof item.position === 'object' &&
        typeof item.position.x === 'number' &&
        typeof item.position.y === 'number' &&
        typeof item.size === 'object' &&
        typeof item.size.width === 'number' &&
        typeof item.size.height === 'number' &&
        (item.assigned === undefined || (
          typeof item.assigned === 'object' &&
          typeof item.assigned.email === 'string' &&
          typeof item.assigned.name === 'string' &&
          typeof item.assigned.color === 'string'
        ))
      );
    });
  }, []);

  const handleFileImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!validateComponentData(data)) {
        alert('Invalid file format. Please select a valid components JSON file.');
        return;
      }

      // Generate new IDs to avoid conflicts and update creation timestamps
      const importedComponents: DocumentComponent[] = data.map((comp: DocumentComponent) => ({
        ...comp,
        id: `imported-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        created: Date.now()
      }));

      // Ask user how to handle import
      const choice = confirm(
        `Found ${importedComponents.length} components in the file.\n\n` +
        'Click OK to ADD these components to existing ones, or Cancel to REPLACE all existing components.'
      );

      let newComponents: DocumentComponent[];
      if (choice) {
        // Add to existing components
        newComponents = [...components, ...importedComponents];
      } else {
        // Replace existing components
        newComponents = importedComponents;
      }

      onComponentsChange?.(newComponents);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      alert(`Successfully imported ${importedComponents.length} components!`);
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Error reading file. Please make sure it\'s a valid JSON file.');
    } finally {
      setIsImporting(false);
    }
  }, [components, onComponentsChange, validateComponentData]);

  if (viewMode !== ViewMode.EDITOR) {
    return (
      <div className={cn('w-80 h-full bg-gray-50 border-l border-gray-200 p-4', className)}>
        <div className="text-sm text-gray-500">Component panel not available in {viewMode} mode</div>
      </div>
    );
  }

  return (
    <div className={cn('w-80 h-full bg-gray-50 border-l border-gray-200 flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-3">Components</h2>
        
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{stats.required}</div>
            <div className="text-xs text-gray-500">Required</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-gray-500">Filled</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search components..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ComponentType | 'all')}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="all">All Types</option>
            {Object.values(ComponentType).map(type => (
              <option key={type} value={type}>
                {TOOLS_INFO[type]?.name || type}
              </option>
            ))}
          </select>

          <select
            value={filterPage}
            onChange={(e) => setFilterPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="all">All Pages</option>
            {Array.from({ length: numPages }, (_, i) => (
              <option key={i} value={i}>
                Page {i + 1} ({stats.byPage.get(i) || 0})
              </option>
            ))}
          </select>

          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          >
            <option value="all">All Assignees</option>
            {assignees.map(assignee => (
              <option key={assignee.email} value={assignee.email}>
                {assignee.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        {(searchTerm || filterType !== 'all' || filterPage !== 'all' || filterAssignee !== 'all') && (
          <button
            onClick={clearAllFilters}
            className="w-full mt-2 px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto p-4">
        {sortedComponents.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            {components.length === 0 ? (
              <>
                <div className="text-4xl mb-2">📝</div>
                <div>No components yet</div>
                <div className="text-xs mt-1">Add components using the palette</div>
                <div className="text-xs mt-2 text-gray-400">or import from a JSON file</div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">🔍</div>
                <div>No components match your filters</div>
                <div className="text-xs mt-1">Try adjusting your search or filters</div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedComponents.map(component => (
              <ComponentItem
                key={component.id}
                component={component}
                isSelected={selectedComponentId === component.id}
                onSelect={handleComponentSelect}
                onDelete={handleComponentDelete}
                onUpdate={handleComponentUpdate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with bulk actions */}
      <div className="border-t border-gray-200 p-4">
        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
        />
        
        <div className="space-y-2">
          {/* Import/Export row */}
          <div className="flex gap-2">
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : 'Import'}
            </button>
            <button
              onClick={() => {
                // Export component data as JSON
                const dataStr = JSON.stringify(components, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `document-components-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              disabled={components.length === 0}
              className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export
            </button>
          </div>
          
          {/* Clear all row (only show if there are components) */}
          {components.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Delete all components? This action cannot be undone.')) {
                  onComponentsChange?.([]);
                }
              }}
              className="w-full px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComponentsPanel;