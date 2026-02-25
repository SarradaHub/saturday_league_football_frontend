import React from 'react';
import { cn } from '../../utils/cn';

export interface SidebarItem {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  icon?: React.ReactNode;
  children?: SidebarItem[];
}

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: SidebarItem[];
  collapsed?: boolean;
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, items, collapsed = false, ...props }, ref) => {
    const renderItem = (item: SidebarItem, index: number, level = 0) => {
      const content = (
        <>
          {item.icon && (
            <span className={cn('flex-shrink-0', !collapsed && 'mr-3')}>
              {item.icon}
            </span>
          )}
          {!collapsed && (
            <span className="flex-1">{item.label}</span>
          )}
        </>
      );

      const itemClasses = cn(
        'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors',
        item.active
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
          : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100',
        level > 0 && 'ml-4',
      );

      if (item.href) {
        return (
          <a
            key={index}
            href={item.href}
            onClick={item.onClick}
            className={itemClasses}
            title={collapsed ? item.label : undefined}
          >
            {content}
          </a>
        );
      }

      return (
        <button
          key={index}
          type="button"
          onClick={item.onClick}
          className={itemClasses}
          title={collapsed ? item.label : undefined}
        >
          {content}
        </button>
      );
    };

    return (
      <aside
        ref={ref}
        className={cn(
          'bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700',
          'transition-all duration-200',
          collapsed ? 'w-16' : 'w-64',
          className,
        )}
        {...props}
      >
        <nav className="p-4 space-y-1">
          {items.map((item, index) => (
            <div key={index}>
              {renderItem(item, index)}
              {!collapsed && item.children && (
                <div className="mt-1 ml-4 space-y-1">
                  {item.children.map((child, childIndex) =>
                    renderItem(child, childIndex, 1),
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
    );
  },
);

Sidebar.displayName = 'Sidebar';

