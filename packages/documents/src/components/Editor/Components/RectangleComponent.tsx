import React from 'react';
import { ComponentProps } from '../types';

export const RectangleComponent: React.FC<ComponentProps> = ({
  component
}) => {
  const borderColor = component.config.borderColor || '#666666';
  const backgroundColor = component.config.backgroundColor || 'transparent';
  const borderWidth = component.config.borderWidth || 2;

  return (
    <div
      className="w-full h-full"
      style={{
        borderColor,
        backgroundColor,
        borderWidth,
        borderStyle: 'solid',
        borderRadius: component.config.borderRadius || 0
      }}
    />
  );
};