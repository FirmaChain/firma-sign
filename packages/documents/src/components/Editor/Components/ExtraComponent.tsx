import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../../utils/cn';
import { ComponentProps, ViewMode } from '../types';

export const ExtraComponent: React.FC<ComponentProps> = ({
  component,
  viewMode,
  onUpdate
}) => {
  const [value, setValue] = useState(component.value || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEditorMode = viewMode === ViewMode.EDITOR;
  const isInputMode = viewMode === ViewMode.INPUT;
  const canEdit = isInputMode && component.assigned;

  // Handle value changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  // Handle blur to save changes
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (onUpdate && value !== component.value) {
      onUpdate({
        ...component,
        value: value.trim()
      });
    }
  }, [onUpdate, component, value]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setValue(component.value || '');
      inputRef.current?.blur();
    }
  }, [component.value, handleBlur]);

  // Update local value when component value changes
  useEffect(() => {
    setValue(component.value || '');
  }, [component.value]);

  const borderColor = component.assigned?.color || component.config.borderColor || '#d1d5db';
  const backgroundColor = component.config.backgroundColor || '#ffffff';
  const hasValue = !!value;

  const inputStyle: React.CSSProperties = {
    fontSize: component.config.fontSize || 14,
    fontFamily: component.config.fontFamily || 'Arial, sans-serif',
    color: component.config.color || '#000000',
    backgroundColor,
    borderColor: isFocused ? borderColor : component.config.borderColor || '#d1d5db',
    borderWidth: component.config.borderWidth || 1,
    borderRadius: component.config.borderRadius || 4
  };

  return (
    <div className="w-full h-full relative">
      <div className="flex items-center w-full h-full">
        <div className="flex-shrink-0 mr-2 text-xs font-medium" style={{ color: borderColor }}>
          📄
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={component.config.placeholder || 'Extra data...'}
          maxLength={component.config.maxLength}
          disabled={!canEdit}
          className={cn(
            'flex-1 h-full px-2 py-1 outline-none border',
            'transition-all duration-200',
            canEdit && 'hover:shadow-sm focus:shadow-md',
            !canEdit && 'cursor-not-allowed bg-gray-50'
          )}
          style={inputStyle}
        />
      </div>

      {/* Required indicator */}
      {component.config.required && !hasValue && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}

      {/* Assigned user indicator in editor mode */}
      {isEditorMode && component.assigned && (
        <div 
          className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: component.assigned.color }}
        />
      )}

      {/* Character count */}
      {component.config.maxLength && isFocused && (
        <div className="absolute -bottom-5 right-0 text-xs text-gray-500">
          {value.length}/{component.config.maxLength}
        </div>
      )}
    </div>
  );
};