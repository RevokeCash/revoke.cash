import { twMerge } from 'tailwind-merge';

interface Props {
  children: React.ReactNode;
  className: string;
}

const Label = ({ children, className }: Props) => {
  const classes = twMerge('text-xs font-semibold flex items-center justify-center py-0.5 px-1.5 rounded-md', className);

  return <div className={classes}>{children}</div>;
};

export default Label;
