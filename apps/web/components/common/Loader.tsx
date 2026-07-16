import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import ErrorDisplay from './ErrorDisplay';

interface Props {
  isLoading: boolean;
  error?: Error;
  children?: ReactNode;
  loadingChildren?: ReactNode;
  className?: string;
  loadingMessage?: string;
}

const Loader = ({ isLoading, error, children, loadingChildren, className, loadingMessage }: Props) => {
  const classes = {
    container: twMerge('animate-pulse bg-zinc-300 dark:bg-zinc-700 rounded-lg', className),
    border: twMerge('absolute inset-0 border border-zinc-400 dark:border-zinc-500 rounded-lg animate-pulse', className),
    message: 'absolute inset-0 flex justify-center items-center',
  };

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (isLoading) {
    return (
      <div className="relative">
        <div className={classes.container}>
          <div className="invisible">{loadingChildren || children}</div>
        </div>
        <div className={classes.border} />
        <div className={classes.message}>{loadingMessage}</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default Loader;
