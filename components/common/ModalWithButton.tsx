'use client';

import type Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { type ComponentProps, cloneElement, type ReactElement, type ReactNode, useState } from 'react';

interface Props {
  button: ReactElement<ComponentProps<typeof Button>>;
  children: ReactNode;
  className?: string;
}

const ModalWithButton = ({ button, children, className }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {cloneElement(button, { onClick: () => setOpen(true) })}
      <Modal open={open} setOpen={setOpen} className={className}>
        {children}
      </Modal>
    </>
  );
};

export default ModalWithButton;
