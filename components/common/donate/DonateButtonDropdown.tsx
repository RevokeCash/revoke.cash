'use client';

import { useTranslations } from 'next-intl';
import { memo, useState } from 'react';
import { DropdownMenuItem } from '../DropdownMenu';
import DonateModal from './DonateModal';

interface Props {
  className?: string;
}

const DonateButtonDropdown = memo(({ className }: Props) => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenuItem className={className} onClick={() => setOpen(true)}>
        {t('common.buttons.donate')}
      </DropdownMenuItem>

      <DonateModal open={open} setOpen={setOpen} type="menu-button" />
    </>
  );
});

export default DonateButtonDropdown;
