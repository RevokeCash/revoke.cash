import { type ForwardedRef, type MouseEventHandler, forwardRef } from 'react';

export interface ButtonProps {
  disabled?: boolean;
  style?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: MouseEventHandler;
  href?: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLElement, ButtonProps>(
  (
    {
      disabled,
      style = 'primary',
      size = 'md',
      onClick,
      href,
      external,
      children,
      className = '',
      loading,
      fullWidth,
      icon,
    },
    ref
  ) => {
    // Tailwind classes based on main app's Button component
    const sizeClasses = {
      sm: 'h-9 px-3 text-sm gap-1.5 min-h-[36px]', // Ensure minimum touch target
      md: 'h-11 px-4 text-base gap-2 min-h-[44px]', // iOS recommended touch target
      lg: 'h-13 px-6 text-lg gap-2.5 min-h-[52px]'
    };

    const styleClasses = {
      primary: 'bg-zinc-900 text-white border border-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:border-white dark:hover:bg-zinc-200',
      secondary: 'bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-800',
      tertiary: 'text-zinc-900 hover:bg-zinc-100 border border-transparent dark:text-white dark:hover:bg-zinc-800',
      danger: 'bg-red-600 text-white border border-red-600 hover:bg-red-700'
    };

    const baseClasses = `inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 
      cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 no-underline
      select-none touch-manipulation ${fullWidth ? 'w-full' : 'w-auto'}`;

    const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${styleClasses[style]} ${className}`;

    const content = (
      <>
        {icon && <span className="flex items-center">{icon}</span>}
        {children}
        {loading && (
          <svg 
            className="animate-spin w-4 h-4"
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25"
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
            />
            <path 
              className="opacity-75"
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" 
            />
          </svg>
        )}
      </>
    );

    if (href) {
      return (
        <a 
          href={href}
          className={combinedClasses}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          ref={ref as ForwardedRef<HTMLAnchorElement>}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onClick}
        className={combinedClasses}
        ref={ref as ForwardedRef<HTMLButtonElement>}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;