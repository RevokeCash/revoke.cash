import { type ForwardedRef, forwardRef, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  size: number;
  className?: string;
  color?: string;
  border?: boolean;
  square?: boolean;
  children?: ReactNode;
}

const PlaceholderIcon = (
  { size, className, color, border, square, children }: Props,
  ref: ForwardedRef<HTMLDivElement>,
) => {
  const classes = twMerge(
    'aspect-square rounded-full',
    color ?? 'bg-zinc-300 dark:bg-zinc-600',
    square ? 'rounded-lg' : 'rounded-full',
    border && 'border border-black dark:border-white',
    className,
  );

  return (
    <div style={{ width: size, height: size }} className={classes} ref={ref}>
      {children}
    </div>
  );
};

export default forwardRef(PlaceholderIcon);
