import type { Ref } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  children: React.ReactNode;
  className: string;
  ref?: Ref<HTMLDivElement>;
}

const Label = ({ children, className, ref }: Props) => {
  const classes = twMerge('text-xs font-semibold flex items-center justify-center py-0.5 px-2 rounded-full', className);

  return (
    <div className={classes} ref={ref}>
      {children}
    </div>
  );
};

export default Label;
