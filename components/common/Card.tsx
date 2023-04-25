import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  title: string;
  children: ReactNode;
  icon?: React.ExoticComponent<React.SVGProps<SVGSVGElement>>;
  className?: string;
}

const Card = ({ title, children, className, ...props }: Props) => {
  return (
    <div className="w-full border border-black dark:border-white rounded-lg">
      <div className="w-full border-b border-black dark:border-white py-2 px-4 flex gap-2 items-center">
        {props.icon && <props.icon className="h-6" />}

        <h3>{title}</h3>
      </div>
      <div className={twMerge('w-full py-2 px-4', className)}>{children}</div>
    </div>
  );
};

export default Card;
