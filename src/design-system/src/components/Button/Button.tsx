import React from 'react';
import { cn } from '../../utils/cn';
import { Icon, type IconProps } from '../../icons/Icon';
import { Loader2 } from 'lucide-react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: IconProps['icon'];
  rightIcon?: IconProps['icon'];
  children: React.ReactNode;
}

const variantClasses = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:bg-primary-800 disabled:bg-primary-300',
  secondary:
    'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 focus:ring-neutral-500 active:bg-neutral-400 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600',
  text: 'text-primary-600 hover:bg-primary-50 focus:ring-primary-500 active:bg-primary-100 dark:text-primary-400 dark:hover:bg-primary-900/20',
  danger:
    'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 active:bg-error-800 disabled:bg-error-300',
  ghost:
    'text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500 active:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2.5',
};

const baseClasses =
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading ? (
          <Icon icon={Loader2} size="sm" className="animate-spin" aria-hidden={true} />
        ) : LeftIcon ? (
          <Icon icon={LeftIcon} size="sm" aria-hidden={true} />
        ) : null}
        {children}
        {!loading && RightIcon && (
          <Icon icon={RightIcon} size="sm" aria-hidden={true} />
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

