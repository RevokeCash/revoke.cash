import Button from 'components/common/Button';
import { usePathname } from 'lib/i18n/navigation';
import { twMerge } from 'tailwind-merge';

interface Props {
  name: string;
  href: string;
}

const AddressNavigationTab = ({ name, href }: Props) => {
  const path = usePathname();
  const isSelected = path?.endsWith(href);

  const classes = twMerge(
    'flex whitespace-nowrap border-b-2 pb-1 text-sm font-medium border-transparent',
    'text-zinc-500 visited:text-zinc-500 dark:text-zinc-400 dark:visited:text-zinc-400',
    'focus-visible:ring-0 focus-visible:border-zinc-400 dark:focus-visible:border-zinc-500',
    isSelected &&
      'border-black text-black visited:text-black dark:border-white dark:text-white dark:visited:text-white',
    !isSelected && 'hover:border-brand hover:text-zinc-700 dark:hover:border-brand dark:hover:text-zinc-300',
  );

  return (
    <div className="relative">
      <Button
        id={name}
        style="none"
        size="none"
        href={href}
        router
        retainSearchParams={['chainId']}
        className={classes}
      >
        {name}
      </Button>
    </div>
  );
};

export default AddressNavigationTab;
