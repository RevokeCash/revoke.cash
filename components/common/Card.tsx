import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  icon?: React.ExoticComponent<React.SVGProps<SVGSVGElement>>;
  className?: string;
}

const Card = ({ title, subtitle, children, className, ...props }: Props) => {
  return (
    <div className="w-full border border-black dark:border-white rounded-lg">
      {(title || subtitle) && (
        <div className="w-full border-b border-black dark:border-white py-2 px-4">
          <h2 className="flex gap-2 items-center">
            {props.icon && <props.icon className="h-6 w-6" />} {title}
          </h2>
          <p>{subtitle}</p>
        </div>
      )}
      <div className={twMerge('w-full py-2 px-4', className)}>{children}</div>
    </div>
  );
};

export default Card;
