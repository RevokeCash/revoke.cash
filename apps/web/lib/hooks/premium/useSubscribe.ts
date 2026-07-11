'use client';

import { ERC20_ABI } from '@revoke.cash/core/abis';
import type { PaymentStatus, PendingPayment } from '@revoke.cash/core/premium/types';
import { delay } from '@revoke.cash/core/utils';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { MINUTE, SECOND } from '@revoke.cash/core/utils/time';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { displayTransactionSubmittedToast } from 'components/common/TransactionSubmittedToast';
import { useEnsureWalletClient } from 'lib/hooks/ethereum/ensureWalletClient';
import ky from 'lib/ky';
import analytics from 'lib/utils/analytics';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { type Address, isAddressEqual, parseUnits } from 'viem';
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
  expiresAt: number;
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

const loadPendingPayment = (ownerAddress: string): PendingPaymentData | null => {
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

    return data;
  } catch {
    return null;
  }
};

const pollPaymentStatus = async (paymentId: string, expiresAt: number): Promise<PaymentStatus> => {
  // The transfer was already submitted, so an expired quote can still confirm once the
  // transaction lands; keep polling through a grace window anchored at the quote's expiry.
  const keepPollingExpiredUntil = expiresAt + 10 * MINUTE;

  const poll = async (): Promise<PaymentStatus> => {
    const status = await ky.get(`/api/premium/payments/${paymentId}/status`).json<PaymentStatus>();

    const canStillSettle = status.status === 'expired' && Date.now() < keepPollingExpiredUntil;
    if (status.status !== 'pending' && !canStillSettle) return status;

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
    const pendingPayment = loadPendingPayment(ownerAddress);
    if (!pendingPayment) return;

    setStatus('confirming');

    pollPaymentStatus(pendingPayment.paymentId, pendingPayment.expiresAt)
      .then((finalStatus) => {
        clearPendingPayment();

        if (finalStatus.status === 'confirmed') {
          setStatus('confirmed');
          queryClient.invalidateQueries({ queryKey: getSubscriptionsQueryKey(ownerAddress) });
          toast.success(t('account.subscription.payment_confirmed'));
          analytics.track('Subscription Purchased', { paymentId: pendingPayment.paymentId, resumed: true });
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
      const pendingPayment = loadPendingPayment(ownerAddress);
      if (pendingPayment) {
        setStatus('confirming');
        const resumedStatus = await pollPaymentStatus(pendingPayment.paymentId, pendingPayment.expiresAt);
        clearPendingPayment();

        if (resumedStatus.status === 'confirmed') {
          analytics.track('Subscription Purchased', { paymentId: pendingPayment.paymentId, resumed: true });
          return resumedStatus;
        }
      }

      // Step 1: Create payment
      setStatus('creating');

      const payment = await ky
        .post('/api/premium/payments', { json: { planId: selectedPlanId, chainId: selectedPaymentChainId } })
        .json<PendingPayment>();

      analytics.track('Subscription Payment Created', {
        paymentId: payment.paymentId,
        planId: payment.planId,
        chainId: payment.chainId,
        amountUsd: payment.amountUsd,
      });

      // Step 2: Switch chain and send ERC20 transfer
      setStatus('paying');

      const walletClient = await ensureWalletClient(payment.chainId);

      const connectedAddress = walletClient.account?.address;
      if (!connectedAddress || !isAddressEqual(connectedAddress, ownerAddress)) {
        throw new Error(t('account.subscription.wrong_wallet_error', { address: ownerAddress }));
      }

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

      analytics.track('Subscription Payment Sent', {
        paymentId: payment.paymentId,
        planId: payment.planId,
        chainId: payment.chainId,
        transactionHash: hash,
      });

      // Persist payment ID so polling can resume after a page refresh or tab reopen
      savePendingPayment(payment.paymentId, ownerAddress, payment.expiresAt);

      // Step 3: Poll for confirmation
      setStatus('confirming');

      const finalStatus = await pollPaymentStatus(payment.paymentId, new Date(payment.expiresAt).getTime());

      clearPendingPayment();

      if (finalStatus.status !== 'confirmed') {
        const errorMessage =
          finalStatus.status === 'expired'
            ? t('account.subscription.payment_expired')
            : t('account.subscription.payment_status_error', { status: finalStatus.status });
        throw new Error(errorMessage);
      }

      analytics.track('Subscription Purchased', {
        paymentId: payment.paymentId,
        planId: payment.planId,
        chainId: payment.chainId,
        amountUsd: payment.amountUsd,
      });

      return finalStatus;
    },
    onSuccess: () => {
      setStatus('confirmed');
      queryClient.invalidateQueries({ queryKey: getSubscriptionsQueryKey(ownerAddress) });
      toast.success(t('account.subscription.payment_confirmed'));
    },
    onError: (error) => {
      setStatus('failed');
      toast.error(parseErrorMessage(error) || t('account.subscription.payment_failed'));
      analytics.track('Subscription Payment Failed', {
        planId: selectedPlanId,
        chainId: selectedPaymentChainId,
        error: parseErrorMessage(error),
      });
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
