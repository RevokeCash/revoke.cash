import Button from 'components/common/Button';
import { useState } from 'react';

const AccountModal = () => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button style="primary" size="md" onClick={() => setOpen(true)}>
        Connect Wallet
      </Button>
    </div>
  );
};

export default AccountModal;
