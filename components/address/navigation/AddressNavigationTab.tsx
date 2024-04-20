import Button from 'components/common/Button';
import { usePathname, useRouter } from 'lib/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { twMerge } from 'tailwind-merge';

interface Props {
  name: string;
  href: string;
}

const AddressNavigationTab = ({ name, href }: Props) => {
  const router = useRouter();
  const path = usePathname();
  const searchParams = useSearchParams();

  const selected = path?.endsWith(href);

  const classes = twMerge(
    'whitespace-nowrap border-b-2 pb-1 text-sm font-medium border-transparent',
    'text-zinc-500 visited:text-zinc-500 dark:text-zinc-400 dark:visited:text-zinc-400',
    selected && 'border-black text-black visited:text-black dark:border-white dark:text-white dark:visited:text-white',
    !selected && 'hover:border-zinc-300 hover:text-zinc-700 dark:hover:border-zinc-400 dark:hover:text-zinc-300',
  );

  const onClick = () => {
    router.replace(`${href}?${searchParams.toString()}`);
  };

  return (
    <Button style="none" size="none" onClick={onClick} className={classes}>
      {name}
    </Button>
  );
};

export default AddressNavigationTab;
