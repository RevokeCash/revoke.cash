'use client';

import TransactionHashCell from 'components/allowances/dashboard/cells/TransactionHashCell';
import Card, { CardTitle } from 'components/common/Card';
import type { PremiumSubscription, SubscriptionPayment } from 'lib/premium/types';
import type { DocumentedChainId } from 'lib/utils/chains';
import { useTranslations } from 'next-intl';

interface Props {
  subscriptions: PremiumSubscription[];
  isLoading: boolean;
}

const BillingSection = ({ subscriptions, isLoading }: Props) => {
  const t = useTranslations();
  const allPayments: SubscriptionPayment[] = subscriptions.flatMap((sub) => sub.payments);

  return (
    <Card
      header={<CardTitle title={t('account.billing.title')} />}
      isLoading={isLoading}
      className="flex flex-col gap-4"
    >
      {!isLoading && allPayments.length === 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.billing.no_payments')}</p>
      )}

      {allPayments.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left text-zinc-600 dark:text-zinc-400">
                <th className="pb-2 pr-4 font-medium">{t('account.billing.columns.date')}</th>
                <th className="pb-2 pr-4 font-medium">{t('account.billing.columns.plan')}</th>
                <th className="pb-2 pr-4 font-medium">{t('account.billing.columns.amount')}</th>
                <th className="pb-2 font-medium">{t('account.billing.columns.transaction')}</th>
              </tr>
            </thead>
            <tbody>
              {allPayments.map((payment) => (
                <tr
                  key={payment.txHash ?? payment.paidAt}
                  className="border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
                >
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">{payment.planName}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    ${payment.amountUsd} {payment.tokenSymbol}
                  </td>
                  <td className="py-3 whitespace-nowrap">
                    <TransactionHashCell
                      chainId={payment.chainId as DocumentedChainId}
                      transactionHash={payment.txHash}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default BillingSection;
