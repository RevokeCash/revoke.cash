'use client';

import type { SubscriptionPayment } from '@revoke.cash/core/premium/types';
import StatusLabel, { type Status } from 'components/common/StatusLabel';
import { getPaymentRefundStatus, type PaymentRefundStatus } from 'lib/utils/cancellation';
import { useTranslations } from 'next-intl';

const STATUS_LABEL_STATUSES: Record<PaymentRefundStatus, Status> = {
  final: 'neutral',
  within_refund_window: 'info',
  pending_refund: 'warning',
  refunded: 'neutral',
};

interface Props {
  payment: SubscriptionPayment;
}

const PaymentStatusCell = ({ payment }: Props) => {
  const t = useTranslations();

  const refundStatus = getPaymentRefundStatus(payment);

  return (
    <div className="py-3 whitespace-nowrap">
      <StatusLabel status={STATUS_LABEL_STATUSES[refundStatus]} className="py-0.75 w-fit">
        {t(`account.billing.status.${refundStatus}`)}
      </StatusLabel>
    </div>
  );
};

export default PaymentStatusCell;
