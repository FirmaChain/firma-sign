import React from 'react';
import { ComponentType, ComponentProps } from './types';
import {
  TextComponent,
  SignatureComponent,
  CheckboxComponent,
  InputFieldComponent,
  StampComponent,
  CheckmarkComponent,
  DateComponent,
  ExtraComponent,
  RectangleComponent,
  CircleComponent,
  LineComponent
} from './Components';

// Component factory that returns the appropriate component based on type
export const ComponentFactory: React.FC<ComponentProps> = (props) => {
  switch (props.component.type) {
    case ComponentType.TEXT:
      return <TextComponent {...props} />;
    case ComponentType.SIGNATURE:
      return <SignatureComponent {...props} />;
    case ComponentType.CHECKBOX:
      return <CheckboxComponent {...props} />;
    case ComponentType.INPUT_FIELD:
      return <InputFieldComponent {...props} />;
    case ComponentType.STAMP:
      return <StampComponent {...props} />;
    case ComponentType.CHECKMARK:
      return <CheckmarkComponent {...props} />;
    case ComponentType.DATE:
      return <DateComponent {...props} />;
    case ComponentType.EXTRA:
      return <ExtraComponent {...props} />;
    case ComponentType.RECTANGLE:
      return <RectangleComponent {...props} />;
    case ComponentType.CIRCLE:
      return <CircleComponent {...props} />;
    case ComponentType.LINE:
      return <LineComponent {...props} />;
    default:
      return (
        <div className="w-full h-full flex items-center justify-center bg-red-100 text-red-600 text-xs">
          Unknown component type: {props.component.type}
        </div>
      );
  }
};