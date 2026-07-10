import type { ReactNode, Ref } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  size: number;
  className?: string;
  color?: string;
  border?: boolean;
  square?: boolean;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

const PlaceholderIcon = ({ size, className, color, border, square, children, ref }: Props) => {
  const classes = twMerge(
    'aspect-square rounded-full',
    color ?? 'bg-zinc-300 dark:bg-zinc-600',
    square ? 'rounded-lg' : 'rounded-full',
    border && 'border border-zinc-200 dark:border-zinc-800',
    className,
  );

  return (
    <div style={{ width: size, height: size }} className={classes} ref={ref}>
      {children}
    </div>
  );
};

export default PlaceholderIcon;
