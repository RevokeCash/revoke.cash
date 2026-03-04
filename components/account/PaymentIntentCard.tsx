import Button from 'components/common/Button';
import type { PaymentIntent, PaymentIntentStatus } from 'lib/premium/types';
import { getChainName } from 'lib/utils/chains';
import PaymentStatusBadge from './PaymentStatusBadge';

interface Props {
  intent: PaymentIntent;
  intentStatus: PaymentIntentStatus | null;
  onPay: () => void;
  isPaying: boolean;
}

const PaymentIntentCard = ({ intent, intentStatus, onPay, isPaying }: Props) => {
  return (
    <div className="rounded-md border border-zinc-300 dark:border-zinc-700 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="font-medium">Payment intent</span>
        {intentStatus?.status ? <PaymentStatusBadge status={intentStatus.status} /> : null}
      </div>

      <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
        <span>
          <span className="text-zinc-600 dark:text-zinc-400">Intent:</span> {intent.intentId}
        </span>
        <span>
          <span className="text-zinc-600 dark:text-zinc-400">Network:</span> {getChainName(intent.chainId)}
        </span>
        <span>
          <span className="text-zinc-600 dark:text-zinc-400">Amount:</span> {intent.amountUsd} {intent.token.symbol}
        </span>
        <span>
          <span className="text-zinc-600 dark:text-zinc-400">Expires:</span>{' '}
          {new Date(intent.expiresAt).toLocaleString()}
        </span>
        <span className="md:col-span-2 break-all">
          <span className="text-zinc-600 dark:text-zinc-400">Recipient:</span> {intent.recipientAddress}
        </span>
        {intentStatus?.matchedTxHash && (
          <span className="md:col-span-2 break-all">
            <span className="text-zinc-600 dark:text-zinc-400">Matched tx:</span> {intentStatus.matchedTxHash}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          style="primary"
          size="md"
          className="w-fit"
          onClick={onPay}
          loading={isPaying}
          disabled={intentStatus?.status === 'confirmed'}
        >
          Pay with wallet
        </Button>

        {intentStatus?.status === 'confirmed' && (
          <span className="text-sm text-green-700 dark:text-green-300 self-center">
            Payment confirmed and premium entitlement granted.
          </span>
        )}
      </div>
    </div>
  );
};

export default PaymentIntentCard;
