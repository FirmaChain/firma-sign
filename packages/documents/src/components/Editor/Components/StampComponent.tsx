import React, { useCallback, useState } from 'react';
import { cn } from '../../../utils/cn';
import { ComponentProps, ViewMode } from '../types';

export const StampComponent: React.FC<ComponentProps> = ({
  component,
  viewMode,
  onUpdate
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const isEditorMode = viewMode === ViewMode.EDITOR;
  const isSignMode = viewMode === ViewMode.SIGN;
  const canSign = isSignMode && component.assigned;
  const hasStamp = !!component.value;

  const handleClick = useCallback(() => {
    if (canSign) {
      // Open stamp selection modal
      console.log('Open stamp modal for:', component.id);
      // This would typically open a stamp selection modal
    }
  }, [canSign, component.id]);

  const handleClear = useCallback(() => {
    if (onUpdate) {
      onUpdate({
        ...component,
        value: ''
      });
    }
  }, [onUpdate, component]);

  const backgroundColor = component.config.backgroundColor || '#f8f9ff';
  const borderColor = component.assigned?.color || component.config.borderColor || '#3b82f6';

  return (
    <div
      className={cn(
        'w-full h-full relative',
        'flex items-center justify-center',
        'border-2 border-dashed rounded',
        canSign && 'cursor-pointer hover:shadow-md',
        hasStamp && 'border-solid',
        isHovered && 'shadow-lg'
      )}
      style={{
        backgroundColor,
        borderColor: hasStamp ? borderColor : `${borderColor}80`
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {hasStamp ? (
        // Show stamp image or representation
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-sm font-medium" style={{ color: borderColor }}>
            🏷️ Stamped
          </div>
          {canSign && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="absolute top-1 right-1 text-xs text-gray-500 hover:text-red-500"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        // Show placeholder
        <div className="text-center">
          <div className="text-2xl mb-1" style={{ color: borderColor }}>
            🏷️
          </div>
          <div className="text-xs text-gray-600">
            {canSign ? 'Click to stamp' : 'Stamp required'}
          </div>
          {component.assigned && (
            <div className="text-xs mt-1 font-medium" style={{ color: borderColor }}>
              {component.assigned.name}
            </div>
          )}
        </div>
      )}

      {/* Required indicator */}
      {component.config.required && !hasStamp && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </div>
  );
};