'use client';

import DropdownMenu, { DropdownMenuItem } from 'components/common/DropdownMenu';
import { usePathname } from 'lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

// This is currently unused, but we can use it to expand the menu beyond what's in the header.
const MoreDropdown = () => {
  const t = useTranslations();

  const path = usePathname();
  const isCurrent = path.startsWith('/learn') || path.startsWith('/about') || path.startsWith('/blog');

  const menuButton = (
    <div className={twMerge(isCurrent && 'underline underline-offset-8 decoration-2')}>{t('common.nav.more')}</div>
  );

  return (
    <DropdownMenu menuButton={menuButton} style="nav" align="left">
      <DropdownMenuItem href="/blog" router className="text-lg">
        {t('common.nav.blog')}
      </DropdownMenuItem>
      <DropdownMenuItem href="/learn" router className="text-lg">
        {t('common.nav.learn')}
      </DropdownMenuItem>
      <DropdownMenuItem href="/learn/faq" router className="text-lg">
        {t('common.nav.faq')}
      </DropdownMenuItem>
      <DropdownMenuItem href="/about" router className="text-lg">
        {t('common.nav.about')}
      </DropdownMenuItem>
    </DropdownMenu>
  );
};

export default MoreDropdown;
