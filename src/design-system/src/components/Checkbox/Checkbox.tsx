import React from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';
import { Icon } from '../../icons/Icon';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, required, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className="w-full">
        <div className="flex items-start gap-3">
          <div className="relative flex items-center">
            <input
              id={checkboxId}
              ref={ref}
              type="checkbox"
              className={cn(
                'peer h-5 w-5 appearance-none rounded border-2',
                'checked:bg-primary-600 checked:border-primary-600',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'dark:border-neutral-600',
                hasError
                  ? 'border-error-500 focus:ring-error-500'
                  : 'border-neutral-300 dark:border-neutral-600',
                className,
              )}
              aria-invalid={hasError}
              aria-describedby={error ? `${checkboxId}-error` : undefined}
              required={required}
              {...props}
            />
            <Icon
              icon={Check}
              size="sm"
              className={cn(
                'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                'text-white pointer-events-none opacity-0 peer-checked:opacity-100',
                'transition-opacity',
              )}
              aria-hidden={true}
            />
          </div>
          {label && (
            <label
              htmlFor={checkboxId}
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
            id={`${checkboxId}-error`}
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

Checkbox.displayName = 'Checkbox';

