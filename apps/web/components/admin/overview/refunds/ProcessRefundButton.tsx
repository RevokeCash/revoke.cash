'use client';

import { getChainName } from '@revoke.cash/core/chains';
import type { PendingRefundRequest } from '@revoke.cash/core/premium/refunds';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import { HOUR } from '@revoke.cash/core/utils/time';
import Button from 'components/common/Button';
import { type ProcessRefundStep, useProcessRefund } from 'lib/hooks/admin/useAdminRefunds';
import { useAuthSession } from 'lib/hooks/auth/useAuthSession';
import { toast } from 'react-toastify';
import { type Address, isAddressEqual } from 'viem';
import { useConnection } from 'wagmi';

interface Props {
  request: PendingRefundRequest;
}

const STEP_LABELS: Record<ProcessRefundStep, string> = {
  idle: 'Process',
  awaiting_wallet: 'Awaiting wallet...',
  confirming: 'Confirming...',
  recording: 'Recording...',
};

const ProcessRefundButton = ({ request }: Props) => {
  const { address: connectedAddress } = useConnection();
  const { siweAddress } = useAuthSession();
  const { processRefund, step } = useProcessRefund(request);

  // A recorded hash means a refund was already sent; only the Record form and Dismiss make sense then
  if (request.refundTxHash) return null;

  const handleProcess = () => {
    if (request.payment.status !== 'confirmed') {
      toast.error(`Payment is '${request.payment.status}', not 'confirmed'; dismiss the request instead of refunding`);
      return;
    }

    if (!connectedAddress) {
      toast.error('Connect a wallet to send the refund');
      return;
    }

    const confirmed = window.confirm(buildConfirmationText(request, connectedAddress, siweAddress));
    if (!confirmed) return;

    processRefund();
  };

  return (
    <Button style="primary" size="sm" onClick={handleProcess} loading={step !== 'idle'}>
      {STEP_LABELS[step]}
    </Button>
  );
};

const buildConfirmationText = (
  request: PendingRefundRequest,
  connectedAddress: Address,
  siweAddress: Address | null,
): string => {
  const { payment } = request;

  const lines = [
    `Send ${formatUsdCents(request.refundAmountUsdCents)} ${payment.tokenSymbol} on ${getChainName(payment.chainId)} to ${payment.ownerAddress}?`,
  ];

  const confirmedRecently = payment.confirmedAt && Date.now() - new Date(payment.confirmedAt).getTime() < 24 * HOUR;
  if (confirmedRecently) {
    lines.push(
      'Warning: this payment was confirmed less than 24 hours ago and is still inside the reorg re-verification window. It is safer to wait.',
    );
  }

  if (siweAddress && !isAddressEqual(connectedAddress, siweAddress)) {
    lines.push(
      `Warning: the refund will be sent from the currently connected wallet (${connectedAddress}), which differs from the admin session address.`,
    );
  }

  return lines.join('\n\n');
};

export default ProcessRefundButton;
