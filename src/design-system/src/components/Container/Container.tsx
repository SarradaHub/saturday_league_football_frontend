import React from 'react';
import { cn } from '../../utils/cn';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'main' | 'header' | 'footer';
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ as: Component = 'div', className, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8', className)}
        {...props}
      />
    );
  },
);

Container.displayName = 'Container';

