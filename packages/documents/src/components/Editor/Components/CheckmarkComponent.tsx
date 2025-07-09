import React, { useCallback } from 'react';
import { cn } from '../../../utils/cn';
import { ComponentProps, ViewMode } from '../types';

export const CheckmarkComponent: React.FC<ComponentProps> = ({
  component,
  viewMode,
  onUpdate
}) => {
  const isEditorMode = viewMode === ViewMode.EDITOR;
  const isInputMode = viewMode === ViewMode.INPUT;
  const canInteract = isInputMode && component.assigned;
  const isChecked = component.value === 'true' || component.value === 'checked';

  const handleToggle = useCallback(() => {
    if (canInteract && onUpdate) {
      onUpdate({
        ...component,
        value: (!isChecked).toString()
      });
    }
  }, [canInteract, isChecked, onUpdate, component]);

  const color = component.assigned?.color || component.config.color || '#3b82f6';

  return (
    <div
      className={cn(
        'w-full h-full relative',
        'flex items-center justify-center',
        canInteract && 'cursor-pointer hover:scale-110',
        'transition-all duration-200'
      )}
      onClick={handleToggle}
    >
      <div
        className={cn(
          'w-5 h-5 flex items-center justify-center',
          'transition-all duration-200',
          isChecked && 'scale-110'
        )}
      >
        {isChecked ? (
          <svg
            className="w-full h-full"
            fill="currentColor"
            viewBox="0 0 20 20"
            style={{ color }}
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <div
            className={cn(
              'w-full h-full border-2 border-dashed rounded',
              'flex items-center justify-center',
              'opacity-50 hover:opacity-75'
            )}
            style={{ borderColor: color }}
          >
            <div className="text-xs" style={{ color }}>
              ✓
            </div>
          </div>
        )}
      </div>

      {/* Required indicator */}
      {component.config.required && !isChecked && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}

      {/* Assigned user indicator in editor mode */}
      {isEditorMode && component.assigned && (
        <div 
          className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: component.assigned.color }}
        />
      )}
    </div>
  );
};