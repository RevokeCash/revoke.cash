'use client';

import Modal from 'components/common/Modal';
import { type ReactElement, type ReactNode, cloneElement, useState } from 'react';

interface Props {
  button: ReactElement;
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
