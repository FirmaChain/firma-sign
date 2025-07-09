import React from 'react';
import { ComponentProps } from '../types';

export const CircleComponent: React.FC<ComponentProps> = ({
  component
}) => {
  const borderColor = component.config.borderColor || '#666666';
  const backgroundColor = component.config.backgroundColor || 'transparent';
  const borderWidth = component.config.borderWidth || 2;

  return (
    <div
      className="w-full h-full rounded-full"
      style={{
        borderColor,
        backgroundColor,
        borderWidth,
        borderStyle: 'solid'
      }}
    />
  );
};