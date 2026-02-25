import React from 'react';
import { cn } from '../../utils/cn';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  striped?: boolean;
  hoverable?: boolean;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, striped = false, hoverable = false, ...props }, ref) => {
    return (
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className={cn(
            'min-w-full divide-y divide-neutral-200 dark:divide-neutral-700',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

Table.displayName = 'Table';

export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ className, ...props }, ref) => {
  return (
    <thead
      ref={ref}
      className={cn(
        'bg-neutral-50 dark:bg-neutral-900/50',
        className,
      )}
      {...props}
    />
  );
});

TableHeader.displayName = 'TableHeader';

export interface TableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  striped?: boolean;
  hoverable?: boolean;
}

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  TableBodyProps
>(({ className, striped = false, hoverable = false, ...props }, ref) => {
  return (
    <tbody
      ref={ref}
      className={cn(
        'bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700',
        striped && 'divide-y-0',
        className,
      )}
      {...props}
    />
  );
});

TableBody.displayName = 'TableBody';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, hoverable = false, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          hoverable &&
            'hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors',
          className,
        )}
        {...props}
      />
    );
  },
);

TableRow.displayName = 'TableRow';

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  TableHeadProps
>(({ className, ...props }, ref) => {
  return (
    <th
      ref={ref}
      className={cn(
        'px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider',
        className,
      )}
      {...props}
    />
  );
});

TableHead.displayName = 'TableHead';

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn(
          'px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100',
          className,
        )}
        {...props}
      />
    );
  },
);

TableCell.displayName = 'TableCell';

