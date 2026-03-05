import type { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import Loader from './Loader';

interface Props {
  header?: ReactNode;
  image?: ReactNode;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  hover?: 'scale';
}

const Card = ({ header, children, className, image, hover, isLoading }: Props) => {
  const hasTopContent = !!header || !!image;

  const outerClass = twMerge(
    'h-full w-full border border-black dark:border-white rounded-lg flex flex-col',
    hover === 'scale' ? 'hover:scale-105 transition' : null,
  );

  const contentClass = twMerge(
    'h-full w-full p-4 grow bg-zinc-50 dark:bg-zinc-900 rounded-b-lg',
    !hasTopContent && 'rounded-t-lg',
    className,
  );

  return (
    <div className={outerClass}>
      {header}
      {image ? (
        <div className={twMerge('border-b border-black dark:border-white overflow-hidden', !header && 'rounded-t-lg')}>
          {image}
        </div>
      ) : null}
      <Loader isLoading={!!isLoading} className={twMerge('border-none', hasTopContent && 'rounded-t-none')}>
        <div className={contentClass}>{children}</div>
      </Loader>
    </div>
  );
};

interface CardHeaderProps {
  children?: ReactNode;
}

export const CardHeader = ({ children }: CardHeaderProps) => {
  return <div className="w-full border-b border-black dark:border-white py-2 px-4">{children}</div>;
};

interface CardTitleProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: React.ExoticComponent<React.SVGProps<SVGSVGElement>>;
}

export const CardTitle = ({ title, subtitle, ...props }: CardTitleProps) => {
  return (
    <CardHeader>
      <h2 className="text-xl flex gap-2 items-center">
        {props.icon && <props.icon className="h-6 w-6" />} {title}
      </h2>
      <p>{subtitle}</p>
    </CardHeader>
  );
};

export default Card;
