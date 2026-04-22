'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { displayTransactionSubmittedToast } from 'components/common/TransactionSubmittedToast';
import { ERC20_ABI } from 'lib/abis';
import { useEnsureWalletClient } from 'lib/hooks/ethereum/ensureWalletClient';
import ky from 'lib/ky';
import type { PaymentStatus, PendingPayment } from 'lib/premium/types';
import { delay } from 'lib/utils';
import { parseErrorMessage } from 'lib/utils/errors';
import { SECOND } from 'lib/utils/time';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { type Address, parseUnits } from 'viem';
import { getSubscriptionsQueryKey } from './usePremiumSubscriptions';

export type SubscribeStatus = 'idle' | 'creating' | 'paying' | 'confirming' | 'confirmed' | 'failed';

interface UseSubscribeParams {
  ownerAddress: Address;
  selectedPlanId: string;
  selectedPaymentChainId: number;
}

const PENDING_PAYMENT_STORAGE_KEY = 'revoke_pending_payment';

interface PendingPaymentData {
  paymentId: string;
  ownerAddress: string;
  expiresAt: number; // unix ms
}

const savePendingPayment = (paymentId: string, ownerAddress: string, expiresAt: string) => {
  try {
    const data: PendingPaymentData = {
      paymentId,
      ownerAddress: ownerAddress.toLowerCase(),
      expiresAt: new Date(expiresAt).getTime(),
    };
    localStorage.setItem(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

const clearPendingPayment = () => {
  try {
    localStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
  } catch {}
};

const loadPendingPayment = (ownerAddress: string): string | null => {
  try {
    const raw = localStorage.getItem(PENDING_PAYMENT_STORAGE_KEY);
    if (!raw) return null;

    const data: PendingPaymentData = JSON.parse(raw);

    // Don't resume polling for expired payments
    if (data.expiresAt <= Date.now()) {
      localStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
      return null;
    }

    // Don't resume polling for a different wallet's payment
    if (data.ownerAddress !== ownerAddress.toLowerCase()) {
      return null;
    }

    return data.paymentId;
  } catch {
    return null;
  }
};

const pollPaymentStatus = async (paymentId: string): Promise<PaymentStatus> => {
  const poll = async (): Promise<PaymentStatus> => {
    const status = await ky.get(`/api/premium/payments/${paymentId}/status`).json<PaymentStatus>();

    if (status.status !== 'pending') return status;

    // Wait 5 seconds before polling again
    await delay(5 * SECOND);
    return poll();
  };

  return poll();
};

export const useSubscribe = ({ ownerAddress, selectedPlanId, selectedPaymentChainId }: UseSubscribeParams) => {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const { ensureWalletClient } = useEnsureWalletClient();
  const [status, setStatus] = useState<SubscribeStatus>('idle');

  // On mount, resume polling if there's a pending payment from a previous page load
  useEffect(() => {
    const pendingPaymentId = loadPendingPayment(ownerAddress);
    if (!pendingPaymentId) return;

    setStatus('confirming');

    pollPaymentStatus(pendingPaymentId)
      .then((finalStatus) => {
        clearPendingPayment();

        if (finalStatus.status === 'confirmed') {
          setStatus('confirmed');
          queryClient.invalidateQueries({ queryKey: getSubscriptionsQueryKey(ownerAddress) });
          toast.success(t('account.subscription.payment_confirmed'));
        } else {
          // expired or failed — no action needed, user can try again
          setStatus('idle');
        }
      })
      .catch(() => {
        // Network error — leave payment in storage to retry on next load
        setStatus('idle');
      });
  }, [ownerAddress, queryClient, t]);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Create payment
      setStatus('creating');

      const payment = await ky
        .post('/api/premium/payments', { json: { planId: selectedPlanId, chainId: selectedPaymentChainId } })
        .json<PendingPayment>();

      // Step 2: Switch chain and send ERC20 transfer
      setStatus('paying');

      const walletClient = await ensureWalletClient(payment.chainId);

      const hash = await walletClient.writeContract({
        account: walletClient.account!,
        chain: walletClient.chain,
        address: payment.token.address,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [payment.recipientAddress, parseUnits(String(payment.amountUsd), payment.token.decimals)],
        kzg: undefined,
      });

      displayTransactionSubmittedToast(payment.chainId, hash);

      // Persist payment ID so polling can resume after a page refresh or tab reopen
      savePendingPayment(payment.paymentId, ownerAddress, payment.expiresAt);

      // Step 3: Poll for confirmation
      setStatus('confirming');

      const finalStatus = await pollPaymentStatus(payment.paymentId);

      clearPendingPayment();

      if (finalStatus.status !== 'confirmed') {
        throw new Error(`Payment ${finalStatus.status}`);
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
      clearPendingPayment();
      toast.error(parseErrorMessage(error) || t('account.subscription.payment_failed'));
    },
  });

  const reset = useCallback(() => {
    setStatus('idle');
    subscribeMutation.reset();
  }, [subscribeMutation.reset]);

  return {
    subscribe: () => subscribeMutation.mutate(),
    isSubscribing: status === 'creating' || status === 'paying' || status === 'confirming',
    status,
    error: subscribeMutation.error ? parseErrorMessage(subscribeMutation.error) : null,
    reset,
  };
};
