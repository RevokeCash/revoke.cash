'use client';

import type { AdminPayment } from '@revoke.cash/core/admin/subscriptions';
import Button from 'components/common/Button';
import { useReconcilePayment } from 'lib/hooks/admin/useAdminSubscriptions';

interface Props {
  payment: AdminPayment;
}

// Reconciliation re-scans the payment's chain for a matching transfer; only pending and
// expired payments can still be matched to one.
const ReconcilePaymentButton = ({ payment }: Props) => {
  const reconcileMutation = useReconcilePayment();

  if (payment.status !== 'pending' && payment.status !== 'expired') return null;

  const handleReconcile = () => {
    const confirmed = window.confirm(`Re-scan chain ${payment.chainId} for a transfer matching this payment?`);
    if (!confirmed) return;
    reconcileMutation.mutate(payment.id);
  };

  return (
    <Button style="secondary" size="sm" onClick={handleReconcile} loading={reconcileMutation.isPending}>
      Reconcile
    </Button>
  );
};

export default ReconcilePaymentButton;
