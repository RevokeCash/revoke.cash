import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { displayTransactionSubmittedToast } from 'components/common/TransactionSubmittedToast';
import { ERC20_ABI } from 'lib/abis';
import { useEnsureWalletClient } from 'lib/hooks/ethereum/ensureWalletClient';
import ky from 'lib/ky';
import type { PaymentIntent, PaymentIntentStatus } from 'lib/premium/types';
import { parseErrorMessage } from 'lib/utils/errors';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { type Address, parseUnits } from 'viem';
import { getSubscriptionsQueryKey } from './usePremiumSubscriptions';

interface UsePaymentIntentParams {
  ownerAddress: Address;
  selectedPlanId: string;
  selectedPaymentChainId: number;
}

export const usePaymentIntent = ({ ownerAddress, selectedPlanId, selectedPaymentChainId }: UsePaymentIntentParams) => {
  const queryClient = useQueryClient();
  const { ensureWalletClient, isLoading: isEnsuringWalletClient } = useEnsureWalletClient();
  const [activeIntent, setActiveIntent] = useState<PaymentIntent | null>(null);

  const intentStatusQuery = useQuery({
    queryKey: ['premium', 'payment-intent-status', activeIntent?.intentId],
    queryFn: async () => {
      return ky.get(`/api/premium/payment-intents/${activeIntent!.intentId}/status`).json<PaymentIntentStatus>();
    },
    enabled: Boolean(activeIntent?.intentId),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 4_000 : false),
  });

  // Invalidate subscriptions when payment is confirmed
  useEffect(() => {
    if (intentStatusQuery.data?.status !== 'confirmed') return;
    queryClient.invalidateQueries({ queryKey: getSubscriptionsQueryKey(ownerAddress) });
  }, [intentStatusQuery.data?.status, queryClient, ownerAddress]);

  const createIntentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlanId) throw new Error('Please select a plan');

      return ky
        .post('/api/premium/payment-intents', { json: { planId: selectedPlanId, chainId: selectedPaymentChainId } })
        .json<PaymentIntent>();
    },
    onSuccess: (intent) => {
      setActiveIntent(intent);
      toast.success('Payment intent created. You can now send the USDC transfer.');
    },
    onError: (error) => {
      toast.error(parseErrorMessage(error) || 'Failed to create payment intent');
    },
  });

  const payIntentMutation = useMutation({
    mutationFn: async () => {
      if (!activeIntent) throw new Error('Create a payment intent first');

      const walletClient = await ensureWalletClient(activeIntent.chainId);

      const hash = await walletClient.writeContract({
        account: walletClient.account!,
        chain: walletClient.chain,
        address: activeIntent.token.address,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [activeIntent.recipientAddress, parseUnits(String(activeIntent.amountUsd), activeIntent.token.decimals)],
        kzg: undefined,
      });

      return hash;
    },
    onSuccess: (hash) => {
      if (activeIntent) {
        displayTransactionSubmittedToast(activeIntent.chainId, hash);
      }
      intentStatusQuery.refetch();
      toast.info('Payment submitted. Waiting for backend reconciliation...');
    },
    onError: (error) => {
      toast.error(parseErrorMessage(error) || 'Failed to send payment transaction');
    },
  });

  return {
    activeIntent,
    intentStatus: intentStatusQuery.data ?? null,
    isIntentStatusFetching: intentStatusQuery.isFetching,
    refreshIntentStatus: () => intentStatusQuery.refetch(),
    createIntent: () => createIntentMutation.mutate(),
    isCreatingIntent: createIntentMutation.isPending,
    payIntent: () => payIntentMutation.mutate(),
    isPayingIntent: payIntentMutation.isPending || isEnsuringWalletClient,
  };
};
