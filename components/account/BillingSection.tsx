'use client';

import TransactionHashCell from 'components/allowances/dashboard/cells/TransactionHashCell';
import Card, { CardTitle } from 'components/common/Card';
import type { PremiumSubscription } from 'lib/premium/types';
import type { DocumentedChainId } from 'lib/utils/chains';

interface Props {
  subscriptions: PremiumSubscription[];
  isLoading: boolean;
}

const BillingSection = ({ subscriptions, isLoading }: Props) => {
  const subscriptionsWithPayments = subscriptions.filter((sub) => sub.payment);

  return (
    <Card header={<CardTitle title="Billing" />} isLoading={isLoading} className="flex flex-col gap-4">
      {!isLoading && subscriptionsWithPayments.length === 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No payment history yet.</p>
      )}

      {subscriptionsWithPayments.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700 text-left text-zinc-600 dark:text-zinc-400">
                <th className="pb-2 pr-4 font-medium">Date</th>
                <th className="pb-2 pr-4 font-medium">Plan</th>
                <th className="pb-2 pr-4 font-medium">Amount</th>
                <th className="pb-2 pr-4 font-medium">Period</th>
                <th className="pb-2 font-medium">Transaction</th>
              </tr>
            </thead>
            <tbody>
              {subscriptionsWithPayments.map((subscription) => {
                const payment = subscription.payment!;

                return (
                  <tr key={subscription.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">{payment.planName}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      ${payment.amountUsd} {payment.tokenSymbol}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {subscription.startsAt.slice(0, 10)} — {subscription.endsAt.slice(0, 10)}
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <TransactionHashCell
                        chainId={payment.chainId as DocumentedChainId}
                        transactionHash={payment.txHash}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default BillingSection;
