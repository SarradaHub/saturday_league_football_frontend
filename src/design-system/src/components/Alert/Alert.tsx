import React from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { Icon } from '../../icons/Icon';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  children: React.ReactNode;
}

const variantClasses = {
  success:
    'bg-success-50 text-success-800 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800',
  error:
    'bg-error-50 text-error-800 border-error-200 dark:bg-error-900/20 dark:text-error-400 dark:border-error-800',
  warning:
    'bg-warning-50 text-warning-800 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800',
  info: 'bg-info-50 text-info-800 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800',
};

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'info',
      title,
      dismissible = false,
      onDismiss,
      children,
      ...props
    },
    ref,
  ) => {
    const IconComponent = iconMap[variant];

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'flex gap-3 p-4 rounded-lg border',
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        <Icon
          icon={IconComponent}
          size="md"
          className="flex-shrink-0 mt-0.5"
          aria-hidden={true}
        />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold mb-1">{title}</h4>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current rounded"
            aria-label="Dismiss alert"
          >
            <Icon icon={X} size="sm" aria-hidden={true} />
          </button>
        )}
      </div>
    );
  },
);

Alert.displayName = 'Alert';

