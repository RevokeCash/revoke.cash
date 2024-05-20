'use client';

import Button from 'components/common/Button';
import { usePathname } from 'lib/i18n/navigation';
import { twMerge } from 'tailwind-merge';

interface Props {
  to: string;
  text: string;

  className?: string;
}

const NavLink = ({ to, text, className }: Props) => {
  const path = usePathname();
  const isCurrent = path.startsWith(to) && !(to === '/learn' && path === '/learn/faq');

  return (
    <Button
      href={to}
      size="none"
      style="tertiary"
      className={twMerge(
        'text-lg shrink-0',
        isCurrent && 'underline underline-offset-8 decoration-2 decoration-brand',
        className,
      )}
      router
    >
      {text}
    </Button>
  );
};

export default NavLink;
