import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../../utils/cn';
import { ComponentProps, ViewMode } from '../types';

export const TextComponent: React.FC<ComponentProps> = ({
  component,
  isFocused = false,
  viewMode,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(component.value || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEditorMode = viewMode === ViewMode.EDITOR;
  const isInputMode = viewMode === ViewMode.INPUT;
  const canEdit = isInputMode && component.assigned;

  // Handle double click to start editing in editor mode
  const handleDoubleClick = useCallback(() => {
    if (isEditorMode) {
      setIsEditing(true);
    }
  }, [isEditorMode]);

  // Handle focus in input mode
  const handleFocus = useCallback(() => {
    if (canEdit) {
      setIsEditing(true);
    }
  }, [canEdit]);

  // Handle blur to save changes
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (onUpdate && value !== component.value) {
      onUpdate({
        ...component,
        value: value.trim()
      });
    }
  }, [onUpdate, component, value]);

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !component.config.multiline) {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setValue(component.value || '');
      setIsEditing(false);
    }
  }, [component.config.multiline, component.value, handleBlur]);

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Update local value when component value changes
  useEffect(() => {
    setValue(component.value || '');
  }, [component.value]);

  const textStyle: React.CSSProperties = {
    fontSize: component.config.fontSize || 14,
    fontFamily: component.config.fontFamily || 'Arial, sans-serif',
    fontWeight: component.config.fontWeight || 'normal',
    color: component.config.color || '#000000',
    backgroundColor: component.config.backgroundColor || 'transparent',
    borderColor: component.config.borderColor || 'transparent',
    borderWidth: component.config.borderWidth || 0,
    borderStyle: 'solid',
    borderRadius: component.config.borderRadius || 0
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={component.config.placeholder || 'Enter text...'}
        maxLength={component.config.maxLength}
        className={cn(
          'w-full h-full resize-none outline-none',
          'border border-blue-500',
          !component.config.multiline && 'overflow-hidden'
        )}
        style={textStyle}
        rows={component.config.multiline ? undefined : 1}
      />
    );
  }

  return (
    <div
      className={cn(
        'w-full h-full flex items-center justify-start',
        'px-1 py-0.5',
        canEdit && 'cursor-text hover:bg-gray-50',
        !value && 'text-gray-400'
      )}
      style={textStyle}
      onDoubleClick={handleDoubleClick}
      onClick={handleFocus}
      title={canEdit ? 'Click to edit' : undefined}
    >
      {value || component.config.placeholder || 'Text'}
    </div>
  );
};