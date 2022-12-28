import { classNames } from 'lib/utils/styles';

interface Props {
  children: React.ReactNode;
  className: string;
}

const Label = ({ children, className }: Props) => {
  const classes = classNames(
    className,
    'text-xs font-semibold flex items-center justify-center py-0.5 px-1.5 rounded-md'
  );

  return <div className={classes}>{children}</div>;
};

export default Label;
