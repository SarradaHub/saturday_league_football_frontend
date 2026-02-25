import React from 'react';
import { cn } from '../../utils/cn';

export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  variant?: 'default' | 'ordered' | 'unordered';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

const spacingClasses = {
  none: '',
  sm: 'space-y-1',
  md: 'space-y-2',
  lg: 'space-y-4',
};

export const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, variant = 'unordered', spacing = 'md', children, ...props }, ref) => {
    const Component = variant === 'ordered' ? 'ol' : 'ul';

    return (
      <Component
        ref={ref as React.Ref<HTMLOListElement & HTMLUListElement>}
        className={cn(
          'text-neutral-900 dark:text-neutral-100',
          spacingClasses[spacing],
          variant === 'unordered' && 'list-disc list-inside',
          variant === 'ordered' && 'list-decimal list-inside',
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

List.displayName = 'List';

export type ListItemProps = React.LiHTMLAttributes<HTMLLIElement>;

export const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn('text-sm', className)}
        {...props}
      />
    );
  },
);

ListItem.displayName = 'ListItem';

