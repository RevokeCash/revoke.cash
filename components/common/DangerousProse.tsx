import { twMerge } from 'tailwind-merge';

interface Props {
  content: string;
  className?: string;
}

const DangerousProse = ({ content, className }: Props) => {
  const classes = twMerge(
    'prose prose-zinc dark:prose-invert max-w-none',
    'prose-h1:text-5xl prose-h1:font-bold prose-h1:tracking-tight prose-h1:m-0',
    'prose-h2:text-3xl prose-h2:font-bold prose-h2:m-0',
    'prose-h3:text-2xl prose-h3:font-bold prose-h3:m-0',
    'prose-h4:text-xl prose-h4:font-bold prose-h4:m-0',
    'prose-h5:text-lg prose-h5:font-bold prose-h5:m-0',
    'prose-h6:text-base prose-h6:font-bold prose-h6:m-0',
    'prose-p:leading-tight prose-p:text-zinc-900 prose-p:dark:text-zinc-100 prose-p:min-w-0',
    'prose-p:min-w-0 min-w-0',
    className
  );

  return <div className={classes} dangerouslySetInnerHTML={{ __html: content }} />;
};

export default DangerousProse;
