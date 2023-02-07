import { classNames } from 'lib/utils/styles';
import { ReactNode } from 'react';

interface Props {
  title?: string;
  children: ReactNode;
  inverted?: boolean;
}

const FullWidthLandingSection = ({ title, children, inverted }: Props) => {
  const classes = classNames('w-full px-4', inverted && 'bg-black dark:bg-zinc-800 text-zinc-100 pt-8 pb-16');
  return (
    <div className={classes}>
      <div className="flex flex-col items-center">
        <h2 className="text-3xl md:text-4xl text-center">{title}</h2>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default FullWidthLandingSection;
