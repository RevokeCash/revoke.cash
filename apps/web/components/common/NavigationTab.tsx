import Button from 'components/common/Button';
import { usePathname } from 'lib/i18n/navigation';
import { twMerge } from 'tailwind-merge';

interface Props {
  name: string;
  href: string;
  retainSearchParams?: string[];
  attention?: boolean;
  // Also select the tab on routes nested under its href (e.g. /admin/lookup/0x123 selects /admin/lookup)
  matchNestedRoutes?: boolean;
}

const NavigationTab = ({ name, href, retainSearchParams, attention, matchNestedRoutes }: Props) => {
  const path = usePathname();
  const isSelected = matchNestedRoutes ? path === href || Boolean(path?.startsWith(`${href}/`)) : path?.endsWith(href);

  const classes = twMerge(
    'flex whitespace-nowrap items-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
    'focus-visible:rounded-md',
    isSelected
      ? 'bg-zinc-900 text-white visited:text-white dark:bg-zinc-100 dark:text-zinc-900 dark:visited:text-zinc-900'
      : twMerge(
          'text-zinc-600 visited:text-zinc-600 dark:text-zinc-400 dark:visited:text-zinc-400',
          'hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100',
        ),
  );

  return (
    <Button
      id={name}
      style="none"
      size="none"
      href={href}
      router
      retainSearchParams={retainSearchParams}
      className={classes}
    >
      {name}
      {attention && <span className="ml-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />}
    </Button>
  );
};

export default NavigationTab;
