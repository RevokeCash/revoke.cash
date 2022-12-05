import { classNames } from 'lib/utils/styles';

interface Props {
  children: React.ReactNode;
  className: string;
}

const Label = ({ children, className }: Props) => {
  return (
    <div
      className={classNames(className, 'text-xs font-semibold flex items-center justify-center py-0.5 px-1 rounded-md')}
    >
      {children}
    </div>
  );
};

export default Label;
