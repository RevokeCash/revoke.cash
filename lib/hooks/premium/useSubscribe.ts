'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { displayTransactionSubmittedToast } from 'components/common/TransactionSubmittedToast';
import { ERC20_ABI } from 'lib/abis';
import { useEnsureWalletClient } from 'lib/hooks/ethereum/ensureWalletClient';
import ky from 'lib/ky';
import type { PaymentIntent, PaymentIntentStatus } from 'lib/premium/types';
import { delay } from 'lib/utils';
import { parseErrorMessage } from 'lib/utils/errors';
import { SECOND } from 'lib/utils/time';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { type Address, parseUnits } from 'viem';
import { getSubscriptionsQueryKey } from './usePremiumSubscriptions';

export type SubscribeStatus = 'idle' | 'creating' | 'paying' | 'confirming' | 'confirmed' | 'failed';

interface UseSubscribeParams {
  ownerAddress: Address;
  selectedPlanId: string;
  selectedPaymentChainId: number;
  activeSubscriptionId?: string;
}

const PENDING_INTENT_STORAGE_KEY = 'revoke_pending_intent';

interface PendingIntentData {
  intentId: string;
  expiresAt: number; // unix ms
}

const savePendingIntent = (intentId: string, expiresAt: string) => {
  try {
    const data: PendingIntentData = { intentId, expiresAt: new Date(expiresAt).getTime() };
    localStorage.setItem(PENDING_INTENT_STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

const clearPendingIntent = () => {
  try {
    localStorage.removeItem(PENDING_INTENT_STORAGE_KEY);
  } catch {}
};

const loadPendingIntent = (): string | null => {
  try {
    const raw = localStorage.getItem(PENDING_INTENT_STORAGE_KEY);
    if (!raw) return null;

    const data: PendingIntentData = JSON.parse(raw);

    // Don't resume polling for expired intents
    if (data.expiresAt <= Date.now()) {
      localStorage.removeItem(PENDING_INTENT_STORAGE_KEY);
      return null;
    }

    return data.intentId;
  } catch {
    return null;
  }
};

const pollIntentStatus = async (intentId: string): Promise<PaymentIntentStatus> => {
  const poll = async (): Promise<PaymentIntentStatus> => {
    const status = await ky.get(`/api/premium/payment-intents/${intentId}/status`).json<PaymentIntentStatus>();

    if (status.status !== 'pending') return status;

    // Wait 5 seconds before polling again
    await delay(5 * SECOND);
    return poll();
  };

  return poll();
};

export const useSubscribe = ({
  ownerAddress,
  selectedPlanId,
  selectedPaymentChainId,
  activeSubscriptionId,
}: UseSubscribeParams) => {
  const queryClient = useQueryClient();
  const { ensureWalletClient } = useEnsureWalletClient();
  const [status, setStatus] = useState<SubscribeStatus>('idle');

  // On mount, resume polling if there's a pending intent from a previous page load
  useEffect(() => {
    const pendingIntentId = loadPendingIntent();
    if (!pendingIntentId) return;

    setStatus('confirming');

    pollIntentStatus(pendingIntentId)
      .then((finalStatus) => {
        clearPendingIntent();

        if (finalStatus.status === 'confirmed') {
          setStatus('confirmed');
          queryClient.invalidateQueries({ queryKey: getSubscriptionsQueryKey(ownerAddress) });
          toast.success('Payment confirmed! Your premium subscription is now active.');
        } else {
          // expired or failed — no action needed, user can try again
          setStatus('idle');
        }
      })
      .catch(() => {
        // Network error — leave intent in storage to retry on next load
        setStatus('idle');
      });
  }, [ownerAddress, queryClient]);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Create payment intent
      setStatus('creating');

      const intent = await ky
        .post('/api/premium/payment-intents', { json: { planId: selectedPlanId, chainId: selectedPaymentChainId } })
        .json<PaymentIntent>();

      // Step 2: Switch chain and send ERC20 transfer
      setStatus('paying');

      const walletClient = await ensureWalletClient(intent.chainId);

      const hash = await walletClient.writeContract({
        account: walletClient.account!,
        chain: walletClient.chain,
        address: intent.token.address,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [intent.recipientAddress, parseUnits(String(intent.amountUsd), intent.token.decimals)],
        kzg: undefined,
      });

      displayTransactionSubmittedToast(intent.chainId, hash);

      // Persist intent ID so polling can resume after a page refresh or tab reopen
      savePendingIntent(intent.intentId, intent.expiresAt);

      // Step 3: Poll for confirmation
      setStatus('confirming');

      const finalStatus = await pollIntentStatus(intent.intentId);

      clearPendingIntent();

      if (finalStatus.status !== 'confirmed') {
        throw new Error(`Payment ${finalStatus.status}`);
      }

      // Step 4: If upgrading an existing subscription, upgrade its plan
      if (activeSubscriptionId) {
        try {
          await ky.put(`/api/premium/subscriptions/${activeSubscriptionId}/upgrade`, {
            json: { planId: selectedPlanId },
          });
        } catch {
          // Non-critical: the new subscription period is already created on the new plan.
          // The current period just stays on the old plan if this fails.
          console.error('Failed to upgrade current subscription plan');
        }
      }

      return finalStatus;
    },
    onSuccess: () => {
      setStatus('confirmed');
      queryClient.invalidateQueries({ queryKey: getSubscriptionsQueryKey(ownerAddress) });
      toast.success('Payment confirmed! Your premium subscription is now active.');
    },
    onError: (error) => {
      setStatus('failed');
      clearPendingIntent();
      toast.error(parseErrorMessage(error) || 'Subscription payment failed');
    },
  });

  const reset = useCallback(() => {
    setStatus('idle');
    subscribeMutation.reset();
  }, [subscribeMutation]);

  return {
    subscribe: () => subscribeMutation.mutate(),
    isSubscribing: status === 'creating' || status === 'paying' || status === 'confirming',
    status,
    error: subscribeMutation.error ? parseErrorMessage(subscribeMutation.error) : null,
    reset,
  };
};
