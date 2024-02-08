import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import SiweButton from 'components/common/SiweButton';
import { useState } from 'react';

const AccountModal = () => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button style="primary" size="md" onClick={() => setOpen(true)}>
        Connect Wallet
      </Button>

      <Modal open={open} setOpen={setOpen}>
        <SiweButton />
      </Modal>
    </div>
  );
};

export default AccountModal;
