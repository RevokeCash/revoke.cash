'use client';

import type { SubscriptionPayment } from '@revoke.cash/core/premium/types';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import CancelSubscriptionModal from 'components/account/CancelSubscriptionModal';
import TransactionHashCell from 'components/allowances/dashboard/cells/TransactionHashCell';
import Button from 'components/common/Button';
import Href from 'components/common/Href';
import { useAccountSubscriptions } from 'lib/hooks/premium/useAccountSubscriptions';
import { getPaymentRefundStatus } from 'lib/utils/cancellation';
import { useTranslations } from 'next-intl';

const TABLE_COLUMN_COUNT = 7;

interface Props {
  payment: SubscriptionPayment;
}

const PaymentDetailsRow = ({ payment }: Props) => {
  const refundStatus = getPaymentRefundStatus(payment);

  return (
    <tr className="border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
      <td colSpan={TABLE_COLUMN_COUNT} className="px-4 py-3">
        {refundStatus === 'within_refund_window' && <WithinRefundWindowDetails payment={payment} />}
        {refundStatus === 'pending_refund' && <PendingRefundDetails payment={payment} />}
        {refundStatus === 'refunded' && <RefundedDetails payment={payment} />}
      </td>
    </tr>
  );
};

export default PaymentDetailsRow;

const WithinRefundWindowDetails = ({ payment }: Props) => {
  const t = useTranslations();
  const { account } = useAccountSubscriptions();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <p className="text-zinc-600 dark:text-zinc-400">{t('account.billing.details.refund_available')}</p>
      {account && (
        <CancelSubscriptionModal
          payment={payment}
          ownerAddress={account}
          trigger={
            <Button style="secondary" size="sm">
              {t('account.subscription.cancellation.confirm_button')}
            </Button>
          }
        />
      )}
    </div>
  );
};

const PendingRefundDetails = ({ payment }: Props) => {
  const t = useTranslations();

  const { refundRequest } = payment;
  if (!refundRequest) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
      <DetailsField
        label={t('account.billing.details.requested_at')}
        value={new Date(refundRequest.requestedAt).toLocaleDateString()}
      />
      <DetailsField
        label={t('account.subscription.cancellation.refund_amount')}
        value={formatUsdCents(refundRequest.refundAmountUsdCents)}
      />
      <ConfirmationDownloadLink payment={payment} />
    </div>
  );
};

const RefundedDetails = ({ payment }: Props) => {
  const t = useTranslations();

  const { refundRequest } = payment;
  if (!refundRequest) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
      <DetailsField
        label={t('account.subscription.cancellation.refund_amount')}
        value={formatUsdCents(refundRequest.refundAmountUsdCents)}
      />
      <DetailsField
        label={t('account.billing.details.refund_transaction')}
        value={<TransactionHashCell chainId={payment.chainId} transactionHash={refundRequest.refundTxHash} />}
      />
      <ConfirmationDownloadLink payment={payment} />
    </div>
  );
};

// The server-generated PDF is the durable-medium acknowledgment of the cancellation statement
const ConfirmationDownloadLink = ({ payment }: Props) => {
  const t = useTranslations();

  return (
    <Href href={`/api/premium/payments/${payment.id}/refund/confirmation`} underline="always">
      {t('account.subscription.cancellation.download_confirmation')}
    </Href>
  );
};

interface DetailsFieldProps {
  label: string;
  value: React.ReactNode;
}

const DetailsField = ({ label, value }: DetailsFieldProps) => (
  <div className="flex items-center gap-2">
    <span className="text-zinc-600 dark:text-zinc-400">{label}:</span>
    <span className="font-medium">{value}</span>
  </div>
);
