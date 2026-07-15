'use client';

import { ERC20_ABI } from '@revoke.cash/core/abis';
import { usdCentsToTokenUnits } from '@revoke.cash/core/premium/payment-config';
import type { PendingRefundRequest, ProcessRefundOutcome } from '@revoke.cash/core/premium/refunds';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { waitForTransactionConfirmation } from '@revoke.cash/core/wallet';
import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { displayTransactionSubmittedToast } from 'components/common/TransactionSubmittedToast';
import { useAdminQuery } from 'lib/hooks/admin/useAdminQuery';
import { useEnsureWalletClient } from 'lib/hooks/ethereum/ensureWalletClient';
import ky from 'lib/ky';
import { useState } from 'react';
import { toast } from 'react-toastify';
import type { Hash } from 'viem';
import { usePublicClient } from 'wagmi';

export const useAdminRefunds = (enabled: boolean) => {
  return useAdminQuery<PendingRefundRequest[]>(['admin', 'refunds'], '/api/admin/refunds', { enabled });
};

const invalidateRefundQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['admin', 'refunds'] });
  queryClient.invalidateQueries({ queryKey: ['admin', 'overview', 'health'] });
  // Processing flips the payment to 'refunded' and rebuilds the subscription
  queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
};

const toastProcessOutcome = (outcome: ProcessRefundOutcome) => {
  if (outcome === 'already_processed') {
    toast.success('Refund was already recorded for this request');
  } else {
    toast.success('Refund recorded and subscription rebuilt');
  }
};

interface RecordRefundParams {
  requestId: string;
  refundTxHash: Hash;
}

// Recovery path for when the refund was sent but recording failed
export const useRecordRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, refundTxHash }: RecordRefundParams) =>
      ky
        .post(`/api/admin/refunds/${requestId}/process`, { json: { refundTxHash } })
        .json<{ outcome: ProcessRefundOutcome }>(),
    onSuccess: (result) => toastProcessOutcome(result.outcome),
    onError: (error) => toast.error(parseErrorMessage(error) || 'Failed to process refund request'),
    onSettled: () => invalidateRefundQueries(queryClient),
  });
};

export const useDismissRefund = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => ky.post(`/api/admin/refunds/${requestId}/dismiss`).json<{ success: true }>(),
    onSuccess: () => toast.success('Refund request dismissed'),
    onError: (error) => toast.error(parseErrorMessage(error) || 'Failed to dismiss refund request'),
    onSettled: () => invalidateRefundQueries(queryClient),
  });
};

export type ProcessRefundStep = 'idle' | 'awaiting_wallet' | 'confirming' | 'recording';

export const useProcessRefund = (request: PendingRefundRequest) => {
  const queryClient = useQueryClient();
  const { ensureWalletClient } = useEnsureWalletClient();
  const publicClient = usePublicClient({ chainId: request.payment.chainId });
  const [step, setStep] = useState<ProcessRefundStep>('idle');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!publicClient) throw new Error(`No public client available for chain ${request.payment.chainId}`);

      setStep('awaiting_wallet');
      const walletClient = await ensureWalletClient(request.payment.chainId);
      const refundAmount = usdCentsToTokenUnits(request.refundAmountUsdCents, request.payment.tokenDecimals);
      const refundTxHash = await walletClient.writeContract({
        account: walletClient.account,
        chain: walletClient.chain,
        address: request.payment.tokenAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [request.payment.ownerAddress, refundAmount],
        kzg: undefined,
      });

      displayTransactionSubmittedToast(request.payment.chainId, refundTxHash);

      setStep('confirming');
      const receipt = await waitForTransactionConfirmation(refundTxHash, publicClient);
      if (receipt?.status === 'reverted') {
        throw new Error(`Refund transaction reverted on-chain: ${refundTxHash}`);
      }

      setStep('recording');
      return ky
        .post(`/api/admin/refunds/${request.id}/process`, { json: { refundTxHash } })
        .json<{ outcome: ProcessRefundOutcome }>();
    },
    onSuccess: (result) => toastProcessOutcome(result.outcome),
    onError: (error) => toast.error(parseErrorMessage(error) || 'Failed to process refund request'),
    onSettled: () => {
      setStep('idle');
      invalidateRefundQueries(queryClient);
    },
  });

  return { processRefund: () => mutation.mutate(), step };
};
