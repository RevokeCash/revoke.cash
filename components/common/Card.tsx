import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import Loader from './Loader';

interface Props {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  image?: ReactNode;
  icon?: React.ExoticComponent<React.SVGProps<SVGSVGElement>>;
  className?: string;
  isLoading?: boolean;
  hover?: 'scale';
}

const Card = ({ title, subtitle, children, className, image, hover, ...props }: Props) => {
  const outerClass = twMerge(
    'h-full w-full border border-black dark:border-white rounded-lg flex flex-col',
    hover === 'scale' ? 'hover:scale-105 transition' : null,
  );

  return (
    <div className={outerClass}>
      {(title || subtitle) && (
        <div className="w-full border-b border-black dark:border-white py-2 px-4">
          <h2 className="text-xl flex gap-2 items-center">
            {props.icon && <props.icon className="h-6 w-6" />} {title}
          </h2>
          <p>{subtitle}</p>
        </div>
      )}
      {image ? <div className="border-b border-black dark:border-white">{image}</div> : null}
      <Loader isLoading={props.isLoading} className="rounded-t-none border-none">
        <div className={twMerge('h-full w-full py-2 px-4 flex-grow', className)}>{children}</div>
      </Loader>
    </div>
  );
};

export default Card;
