import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  children: ReactNode;
  className?: string;
}

const Prose = ({ children, className }: Props) => {
  const classes = twMerge(
    'prose prose-zinc dark:prose-invert max-w-none',
    'prose-h1:text-5xl prose-h1:font-bold prose-h1:tracking-tight prose-h1:m-0',
    'prose-h2:text-3xl prose-h2:font-bold prose-h2:m-0 prose-h2:mb-2',
    'prose-h3:text-2xl prose-h3:font-bold prose-h3:m-0 prose-h3:mb-1',
    'prose-h4:text-xl prose-h4:font-bold prose-h4:m-0',
    'prose-h5:text-lg prose-h5:font-bold prose-h5:m-0',
    'prose-h6:text-base prose-h6:font-bold prose-h6:m-0',
    'prose-p:leading-tight prose-p:min-w-0',
    'prose-p:min-w-0 min-w-0',
    'prose-img:rounded-lg prose-img:border prose-img:border-black dark:prose-img:border-white prose-img:mx-auto prose-img:my-4',
    'prose-li:-my-2 marker:prose-li:text-zinc-500',
    className
  );

  return <div className={classes}>{children}</div>;
};

export default Prose;
