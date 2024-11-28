'use client';

import Button from 'components/common/Button';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import DonateModal, { DonateButtonType } from './DonateModal';

interface Props {
  size: 'sm' | 'md' | 'lg' | 'none' | 'menu';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
  type: DonateButtonType;
}

const DonateButton = ({ size, style, className, type }: Props) => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button style={style ?? 'primary'} size={size} className={className} onClick={handleOpen}>
        {t('common.buttons.donate')}
      </Button>

      <DonateModal open={open} setOpen={(open) => (open ? handleOpen() : handleClose())} type={type} />
    </>
  );
};

export default DonateButton;
