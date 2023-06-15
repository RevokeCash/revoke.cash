import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  isLoading: boolean;
  children?: ReactNode;
  loadingChildren?: ReactNode;
  className?: string;
  loadingMessage?: string;
}

const Loader = ({ isLoading, children, loadingChildren, className, loadingMessage }: Props) => {
  const classes = twMerge(
    'animate-pulse bg-zinc-300 dark:bg-zinc-700 rounded-lg border border-zinc-400 dark:border-zinc-500',
    className
  );

  if (isLoading) {
    return (
      <div className="relative">
        <div className={classes}>
          <div className="invisible">{loadingChildren || children}</div>
        </div>
        <div className="absolute inset-0 flex justify-center items-center">{loadingMessage}</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default Loader;
