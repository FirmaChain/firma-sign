import React, { useCallback, useState } from 'react';
import { cn } from '../../../utils/cn';
import { ComponentProps, ViewMode } from '../types';

export const SignatureComponent: React.FC<ComponentProps> = ({
  component,
  viewMode,
  onUpdate
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const isEditorMode = viewMode === ViewMode.EDITOR;
  const isSignMode = viewMode === ViewMode.SIGN;
  const canSign = isSignMode && component.assigned;
  const hasSignature = !!component.value;

  const handleClick = useCallback(() => {
    if (canSign) {
      // Open signature modal or drawing interface
      console.log('Open signature modal for:', component.id);
      // This would typically open a signature pad modal
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
        hasSignature && 'border-solid',
        isHovered && 'shadow-lg'
      )}
      style={{
        backgroundColor,
        borderColor: hasSignature ? borderColor : `${borderColor}80`
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {hasSignature ? (
        // Show signature image or representation
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-sm font-medium" style={{ color: borderColor }}>
            ✓ Signed
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
            ✒️
          </div>
          <div className="text-xs text-gray-600">
            {canSign ? 'Click to sign' : 'Signature required'}
          </div>
          {component.assigned && (
            <div className="text-xs mt-1 font-medium" style={{ color: borderColor }}>
              {component.assigned.name}
            </div>
          )}
        </div>
      )}

      {/* Required indicator */}
      {component.config.required && !hasSignature && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </div>
  );
};