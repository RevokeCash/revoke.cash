'use client';

import Button from 'components/common/Button';
import { usePathname } from 'lib/i18n/navigation';
import { twMerge } from 'tailwind-merge';

interface Props {
  to: string;
  text: string;
  external?: boolean;

  className?: string;
}

const NavLink = ({ to, text, external, className }: Props) => {
  const path = usePathname();
  const isCurrent = !external && path.startsWith(to) && !(to === '/premium' && path !== '/premium');

  return (
    <Button
      href={to}
      size="none"
      style="tertiary"
      className={twMerge(
        'text-lg shrink-0 underline underline-offset-8 decoration-2 transition-[text-decoration-color] duration-150',
        isCurrent ? 'decoration-black dark:decoration-white' : 'decoration-transparent hover:decoration-brand',
        className,
      )}
      router={!external}
      external={external}
    >
      {text}
    </Button>
  );
};

export default NavLink;
