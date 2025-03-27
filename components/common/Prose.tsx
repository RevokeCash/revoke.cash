import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

const Prose = ({ children, className, ...props }: Props) => {
  const classes = twMerge(
    'prose prose-zinc dark:prose-invert max-w-none',
    'prose-h1:text-4xl md:prose-h1:text-5xl prose-h1:font-bold prose-h1:tracking-tight prose-h1:m-0',
    'prose-h2:text-3xl prose-h2:font-bold prose-h2:m-0 prose-h2:mb-2',
    'prose-h3:text-2xl prose-h3:font-bold prose-h3:m-0 prose-h3:mb-1',
    'prose-h4:text-xl prose-h4:font-bold prose-h4:m-0',
    'prose-h5:text-lg prose-h5:font-bold prose-h5:m-0',
    'prose-h6:text-base prose-h6:font-bold prose-h6:m-0',
    'prose-p:text-zinc-700 dark:prose-p:text-zinc-300',
    'prose-p:min-w-0 min-w-0 prose-p:last:mb-0',
    'prose-li:text-zinc-700 dark:prose-li:text-zinc-300',
    'prose-li:leading-normal prose-li:my-1',
    'prose-li:marker:text-zinc-600 dark:prose-li:marker:text-zinc-400',
    'prose-code:rounded-sm prose-code:px-1 prose-code:py-0.5 prose-code:bg-zinc-200 dark:prose-code:bg-zinc-800 prose-code:font-normal',
    'prose-code:before:content-none prose-code:after:content-none',
    'prose-img:rounded-lg prose-img:border prose-img:border-black dark:prose-img:border-white prose-img:mx-auto prose-img:my-0',
    className,
  );

  return (
    <div {...props} className={classes}>
      {children}
    </div>
  );
};

export default Prose;
