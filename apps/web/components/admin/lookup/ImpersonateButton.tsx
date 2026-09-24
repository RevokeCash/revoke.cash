'use client';

import Button from 'components/common/Button';
import { useStartImpersonation } from 'lib/hooks/admin/useAdminImpersonation';
import type { Address } from 'viem';

interface Props {
  address: Address;
  className?: string;
}

// Opens the account page exactly as this user sees it; the server rejects write actions for the whole visit
const ImpersonateButton = ({ address, className }: Props) => {
  const startImpersonation = useStartImpersonation();

  const handleClick = () => {
    startImpersonation.mutate(address, { onSuccess: () => window.location.assign('/account') });
  };

  return (
    <Button
      style="secondary"
      size="sm"
      onClick={handleClick}
      loading={startImpersonation.isPending}
      className={className}
    >
      View account as user
    </Button>
  );
};

export default ImpersonateButton;
