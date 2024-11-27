import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ISidebarEntry } from 'lib/interfaces';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import Button from './Button';

interface Props {
  currentPath: string;
  pages: Array<ISidebarEntry>;
}

const PageNavigation = ({ currentPath, pages }: Props) => {
  const sidebarPages = pages.flatMap((entry) => [entry, ...(entry?.children ?? [])]);
  const currentPageIndex = sidebarPages.findIndex((page) => page.path === currentPath);
  const previousPage = sidebarPages[currentPageIndex - 1];
  const nextPage = sidebarPages[currentPageIndex + 1];

  return (
    <div className="grid grid-cols-2 gap-2 items-stretch my-6">
      <PageButton page={previousPage} direction="previous" />
      <PageButton page={nextPage} direction="next" />
    </div>
  );
};

interface PageButtonProps {
  page: Pick<ISidebarEntry, 'title' | 'path'>;
  direction: 'previous' | 'next';
}

const PageButton = ({ page, direction }: PageButtonProps) => {
  const t = useTranslations();
  if (!page) return <div />;

  const buttonClasses = twMerge(
    'rounded-lg py-2 px-4 flex items-start h-full border-zinc-300 dark:border-zinc-700 whitespace-normal',
    direction === 'previous' ? 'justify-start' : 'justify-end',
  );

  const contentClasses = twMerge(
    'flex flex-col justify-start gap-1',
    direction === 'previous' ? 'items-start' : 'items-end',
  );

  const titleClasses = twMerge('text-sm md:text-base', direction === 'previous' ? 'text-left' : 'text-right');

  return (
    <Button size="none" style="secondary" className={buttonClasses} href={page.path} router>
      <div className={contentClasses}>
        <div className="text-xs md:text-sm">{t(`common.buttons.${direction}`)}</div>
        <div className="text-sm md:text-base flex items-center">
          {direction === 'previous' && <ChevronLeftIcon className="w-5 h-5 mr-1 md:mr-2 shrink-0" />}
          <div className={titleClasses}>{page.title}</div>
          {direction === 'next' && <ChevronRightIcon className="w-5 h-5 ml-1 md:ml-2 shrink-0" />}
        </div>
      </div>
    </Button>
  );
};

export default PageNavigation;
