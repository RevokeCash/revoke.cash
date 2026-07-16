'use client';

import type { PendingRefundRequest } from '@revoke.cash/core/premium/refunds';
import Button from 'components/common/Button';
import { useDismissRefund } from 'lib/hooks/admin/useAdminRefunds';

interface Props {
  request: PendingRefundRequest;
}

const DismissRefundButton = ({ request }: Props) => {
  const dismissMutation = useDismissRefund();

  const handleDismiss = () => {
    const confirmed = window.confirm(
      'Dismiss this refund request? This is for reversed payments or users who changed their mind.',
    );
    if (!confirmed) return;
    dismissMutation.mutate(request.id);
  };

  return (
    <Button style="secondary" size="sm" onClick={handleDismiss} loading={dismissMutation.isPending}>
      Dismiss
    </Button>
  );
};

export default DismissRefundButton;
