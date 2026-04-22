import { isNullish } from '@revoke.cash/core/utils';
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
  const hasTopContent = !isNullish(header) || !isNullish(image);

  const outerClass = twMerge(
    'h-full w-full border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col',
    hover === 'scale' ? 'hover:scale-105 transition' : null,
  );

  const contentClass = twMerge('h-full w-full p-4 grow rounded-b-xl', !hasTopContent && 'rounded-t-xl', className);

  return (
    <div className={outerClass}>
      {header}
      {image ? (
        <div
          className={twMerge(
            'border-b border-zinc-200 dark:border-zinc-800 overflow-hidden',
            !header && 'rounded-t-xl',
          )}
        >
          {image}
        </div>
      ) : null}
      <Loader isLoading={Boolean(isLoading)} className={twMerge('border-none', hasTopContent && 'rounded-t-none')}>
        <div className={contentClass}>{children}</div>
      </Loader>
    </div>
  );
};

interface CardHeaderProps {
  children?: ReactNode;
}

export const CardHeader = ({ children }: CardHeaderProps) => {
  return <div className="w-full border-b border-zinc-200 dark:border-zinc-800 py-2 px-4">{children}</div>;
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
