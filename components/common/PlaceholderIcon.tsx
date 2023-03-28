import { ForwardedRef, forwardRef, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  size: number;
  className?: string;
  color?: string;
  border?: boolean;
  children?: ReactNode;
}

const PlaceholderIcon = ({ size, className, color, border, children }: Props, ref: ForwardedRef<HTMLDivElement>) => {
  const classes = twMerge(
    'aspect-square rounded-full',
    color ?? 'bg-zinc-300 dark:bg-zinc-600',
    border && 'border border-black dark:border-white',
    className
  );
  return (
    <div style={{ width: size, height: size }} className={classes} ref={ref}>
      {children}
    </div>
  );
};

export default forwardRef(PlaceholderIcon);
