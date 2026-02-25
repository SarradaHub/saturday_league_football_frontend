import React from 'react';
import { cn } from '../../utils/cn';

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, error, id, required, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className="w-full">
        <div className="flex items-start gap-3">
          <div className="relative flex items-center">
            <input
              id={radioId}
              ref={ref}
              type="radio"
              className={cn(
                'peer h-5 w-5 appearance-none rounded-full border-2',
                'checked:border-primary-600',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'dark:border-neutral-600',
                'before:content-[""] before:absolute before:left-1/2 before:top-1/2',
                'before:-translate-x-1/2 before:-translate-y-1/2',
                'before:w-2.5 before:h-2.5 before:rounded-full',
                'before:bg-primary-600 before:opacity-0 peer-checked:opacity-100',
                'before:transition-opacity',
                hasError
                  ? 'border-error-500 focus:ring-error-500'
                  : 'border-neutral-300 dark:border-neutral-600',
                className,
              )}
              aria-describedby={error ? `${radioId}-error` : undefined}
              required={required}
              {...props}
            />
          </div>
          {label && (
            <label
              htmlFor={radioId}
              className={cn(
                'text-sm font-medium cursor-pointer',
                'text-neutral-700 dark:text-neutral-300',
                props.disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              {label}
              {required && <span className="text-error-500 ml-1">*</span>}
            </label>
          )}
        </div>
        {error && (
          <p
            id={`${radioId}-error`}
            className="mt-1 text-sm text-error-600 dark:text-error-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Radio.displayName = 'Radio';

