import { SparklesIcon } from '@heroicons/react/24/solid';
import Button from 'components/common/Button';
import { useMounted } from 'lib/hooks/useMounted';
import { useCsrRouter } from 'lib/i18n/csr-navigation';
import { usePathname } from 'lib/i18n/navigation';
import { useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import useLocalStorage from 'use-local-storage';

interface Props {
  name: string;
  href: string;
}

const AddressNavigationTab = ({ name, href }: Props) => {
  const isMounted = useMounted();
  const [visitedTabs, setVisitedTabs] = useLocalStorage<string[]>('visited-tabs', ['', '/signatures', '/coverage']);

  const router = useCsrRouter();
  const path = usePathname();
  const isSelected = path?.endsWith(href);

  const BASE_PATH_LENGTH = 51;
  const tabId = href.slice(BASE_PATH_LENGTH);

  const isNew = isMounted && !visitedTabs?.includes(tabId);

  const classes = twMerge(
    'whitespace-nowrap border-b-2 pb-1 text-sm font-medium border-transparent',
    'text-zinc-500 visited:text-zinc-500 dark:text-zinc-400 dark:visited:text-zinc-400',
    isSelected &&
      'border-black text-black visited:text-black dark:border-white dark:text-white dark:visited:text-white',
    !isSelected && 'hover:border-zinc-300 hover:text-zinc-700 dark:hover:border-zinc-400 dark:hover:text-zinc-300',
  );

  const onClick = () => {
    router.replace(`${href}`, { retainSearchParams: ['chainId'] });
  };

  useEffect(() => {
    if (!isNew) return;
    if (!isSelected) return;
    setVisitedTabs((prev) => [...(prev ?? []), tabId]);
  }, [isSelected, isNew, tabId, setVisitedTabs]);

  return (
    <div className={twMerge('relative', isNew && 'mr-2')}>
      <Button id={name} style="none" size="none" onClick={onClick} className={classes}>
        {name}
      </Button>
      {isNew && <SparklesIcon className="absolute -top-0.25 -right-4 w-4 h-4 text-brand animate-pulse" />}
    </div>
  );
};

export default AddressNavigationTab;
