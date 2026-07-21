'use client';

import type { SubscriptionPayment } from '@revoke.cash/core/premium/types';
import { useTranslations } from 'next-intl';

interface Props {
  payment: SubscriptionPayment;
}

const PaymentAmountCell = ({ payment }: Props) => {
  const t = useTranslations();

  if (payment.isComplimentary) {
    return <div className="py-3 whitespace-nowrap">{t('account.billing.complimentary')}</div>;
  }

  return (
    <div className="py-3 whitespace-nowrap">
      {payment.amountUsdCents / 100} {payment.tokenSymbol}
    </div>
  );
};

export default PaymentAmountCell;
