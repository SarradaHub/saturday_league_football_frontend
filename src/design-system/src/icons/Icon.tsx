import React from 'react';
import { cn } from '../utils/cn';

export interface IconProps {
  icon: React.ElementType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export const Icon: React.FC<IconProps> = ({
  icon: IconComponent,
  size = 'md',
  className,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  ...props
}) => {
  return (
    <IconComponent
      className={cn(sizeMap[size], className)}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden ?? (!ariaLabel ? true : undefined)}
      {...props}
    />
  );
};

