'use client';

import type { SubscriptionPayment } from '@revoke.cash/core/premium/types';
import InformationIconTooltip from 'components/common/InformationIconTooltip';
import { useTranslations } from 'next-intl';

interface Props {
  payment: SubscriptionPayment;
}

const PaymentAmountCell = ({ payment }: Props) => {
  const t = useTranslations();

  if (payment.isComplimentary) {
    return (
      <div className="py-3 whitespace-nowrap flex items-center gap-1.5">
        {t('account.billing.complimentary')}
        {payment.grantReason && <InformationIconTooltip tooltip={payment.grantReason} />}
      </div>
    );
  }

  return (
    <div className="py-3 whitespace-nowrap">
      {payment.amountUsdCents / 100} {payment.tokenSymbol}
    </div>
  );
};

export default PaymentAmountCell;
