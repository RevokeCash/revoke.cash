import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  title?: string;
  children: ReactNode;
  inverted?: boolean;
}

const FullWidthLandingSection = ({ title, children, inverted }: Props) => {
  const classes = twMerge('w-full px-4', inverted && 'bg-black dark:bg-zinc-900 text-zinc-100 pt-8 pb-16');
  return (
    <div className={classes}>
      <div className="flex flex-col items-center">
        <h2 className="text-center">{title}</h2>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default FullWidthLandingSection;
