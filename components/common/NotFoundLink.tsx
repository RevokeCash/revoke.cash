import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Href from 'components/common/Href';
import { ReactNode } from 'react';

interface Props {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
}

const NotFoundLink = ({ title, description, icon, href }: Props) => {
  return (
    <Href href={href} className="flex items-start gap-4 py-6" underline="none" router>
      <div className="flex-shrink-0">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-800">
          {icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base">{title}</h3>
        <p className="text-base text-gray-500">{description}</p>
      </div>
      <div className="flex-shrink-0 self-center">
        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
      </div>
    </Href>
  );
};

export default NotFoundLink;
