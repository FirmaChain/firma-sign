import React from 'react';
import { ComponentProps } from '../types';

export const LineComponent: React.FC<ComponentProps> = ({
  component
}) => {
  const backgroundColor = component.config.backgroundColor || '#666666';

  return (
    <div
      className="w-full h-full"
      style={{
        backgroundColor
      }}
    />
  );
};