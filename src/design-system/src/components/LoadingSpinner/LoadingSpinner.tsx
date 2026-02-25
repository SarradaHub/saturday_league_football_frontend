import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Icon } from '../../icons/Icon';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = 'md', text, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center', className)}
        role="status"
        aria-label={text || 'Loading'}
        {...props}
      >
        <Icon
          icon={Loader2}
          size="lg"
          className={cn('animate-spin text-primary-600', sizeClasses[size])}
          aria-hidden={true}
        />
        {text && (
          <p className="mt-2 text-sm text-neutral-600" aria-live="polite">
            {text}
          </p>
        )}
      </div>
    );
  },
);

LoadingSpinner.displayName = 'LoadingSpinner';

