'use client';

import Button from 'components/common/Button';
import { useTranslations } from 'next-intl';
import type { MutableRefObject, ReactText } from 'react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import DonateModal from './DonateModal';

interface Props {
  size: 'sm' | 'md' | 'lg' | 'none' | 'menu';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
  parentToastRef?: MutableRefObject<ReactText>;
}

const DonateButton = ({ size, style, className, parentToastRef }: Props) => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    if (parentToastRef) {
      toast.update(parentToastRef.current, { autoClose: false, closeButton: false, draggable: false });
    }
    setOpen(true);
  };

  const handleClose = () => {
    if (parentToastRef) toast.dismiss(parentToastRef.current);
    setOpen(false);
  };

  return (
    <>
      <Button style={style ?? 'primary'} size={size} className={className} onClick={handleOpen}>
        {t('common.buttons.donate')}
      </Button>

      <DonateModal open={open} setOpen={(open) => (open ? handleOpen() : handleClose())} />
    </>
  );
};

export default DonateButton;
