import { ForwardedRef, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  children: React.ReactNode;
  className: string;
}

const Label = ({ children, className }: Props, ref: ForwardedRef<HTMLDivElement>) => {
  const classes = twMerge('text-xs font-semibold flex items-center justify-center py-0.5 px-2 rounded-md', className);

  return (
    <div className={classes} ref={ref}>
      {children}
    </div>
  );
};

export default forwardRef(Label);
