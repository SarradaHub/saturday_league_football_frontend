import React from 'react';
import { cn } from '../../utils/cn';
import { Container } from '../Container';

export interface FooterLink {
  label: string;
  href: string;
  icon?: React.ReactNode;
  external?: boolean;
}

export interface FooterSection {
  title: string;
  items: FooterLink[];
}

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  brandTitle: React.ReactNode;
  description?: React.ReactNode;
  sections?: FooterSection[];
  bottomText?: React.ReactNode;
  variant?: 'dark' | 'light';
}

export const Footer = React.forwardRef<HTMLElement, FooterProps>(
  (
    {
      brandTitle,
      description,
      sections = [],
      bottomText,
      variant = 'dark',
      className,
      ...props
    },
    ref,
  ) => {
    const variantClasses = {
      dark: 'bg-neutral-900 text-neutral-300',
      light: 'bg-neutral-50 text-neutral-600',
    };

    return (
      <footer ref={ref} className={cn(variantClasses[variant], className)} {...props}>
        <Container>
          <div className="grid grid-cols-1 gap-8 py-12 md:grid-cols-3">
            <div className="space-y-4">
              <div
                className={cn(
                  'text-2xl font-bold',
                  variant === 'dark' ? 'text-primary-400' : 'text-primary-600',
                )}
              >
                {brandTitle}
              </div>
              {description && (
                <p className={cn('leading-relaxed', variant === 'dark' ? 'text-neutral-400' : 'text-neutral-500')}>
                  {description}
                </p>
              )}
            </div>
            {sections.map((section) => (
              <div key={section.title} className="space-y-4">
                <h4
                  className={cn(
                    'text-lg font-semibold',
                    variant === 'dark' ? 'text-neutral-50' : 'text-neutral-900',
                  )}
                >
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2 transition-colors',
                          variant === 'dark'
                            ? 'text-neutral-300 hover:text-primary-400'
                            : 'text-neutral-600 hover:text-primary-600',
                        )}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noopener noreferrer' : undefined}
                      >
                        {item.icon ? <span className="flex-shrink-0">{item.icon}</span> : null}
                        <span>{item.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
        {bottomText && (
          <div
            className={cn(
              'border-t py-6 text-center text-sm',
              variant === 'dark'
                ? 'border-neutral-800 text-neutral-400'
                : 'border-neutral-200 text-neutral-500',
            )}
          >
            {bottomText}
          </div>
        )}
      </footer>
    );
  },
);

Footer.displayName = 'Footer';

