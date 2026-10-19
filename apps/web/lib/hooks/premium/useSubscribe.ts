'use client';

import { ERC20_ABI } from '@revoke.cash/core/abis';
import { createViemPublicClientForChain, getChainName } from '@revoke.cash/core/chains';
import { type PaymentToken, usdCentsToTokenUnits } from '@revoke.cash/core/premium/payment-config';
import type { PaymentStatus, PendingPayment, PremiumPlan } from '@revoke.cash/core/premium/types';
import { delay } from '@revoke.cash/core/utils';
import { parseErrorMessage, SwitchChainHandledError } from '@revoke.cash/core/utils/errors';
import { withFallback } from '@revoke.cash/core/utils/promises';
import { MINUTE, SECOND } from '@revoke.cash/core/utils/time';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { displayTransactionSubmittedToast } from 'components/common/TransactionSubmittedToast';
import { useEnsureWalletClient } from 'lib/hooks/ethereum/ensureWalletClient';
import ky from 'lib/ky';
import analytics from 'lib/utils/analytics';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { type Address, isAddressEqual } from 'viem';
import { getPremiumEntitlementsQueryKey } from './usePremiumEntitlements';
import { getSubscriptionsQueryKey } from './usePremiumSubscriptions';

export type SubscribeStatus = 'idle' | 'creating' | 'paying' | 'confirming' | 'confirmed' | 'failed';

interface UseSubscribeParams {
  ownerAddress: Address;
  selectedPlan: PremiumPlan | null;
  selectedPaymentChainId: number;
  selectedPaymentToken: PaymentToken | null;
  isAuthenticated: boolean;
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

// A wallet that can't cover the plan price can never complete the payment, so we check the balance
// before creating a payment. If the balance can't be read, we proceed rather than block the payment.
const hasSufficientTokenBalance = async (
  ownerAddress: Address,
  plan: PremiumPlan,
  chainId: number,
  paymentToken: PaymentToken,
): Promise<boolean> => {
  const publicClient = createViemPublicClientForChain(chainId);
  const balance = await withFallback(
    publicClient.readContract({
      address: paymentToken.address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [ownerAddress],
    }),
    null,
  );

  if (balance === null) return true;
  return balance >= usdCentsToTokenUnits(plan.priceUsdCents, paymentToken.decimals);
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

export const useSubscribe = ({
  ownerAddress,
  selectedPlan,
  selectedPaymentChainId,
  selectedPaymentToken,
  isAuthenticated,
}: UseSubscribeParams) => {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const { ensureWalletClient } = useEnsureWalletClient();
  const [status, setStatus] = useState<SubscribeStatus>('idle');

  // A confirmed payment changes both the owner's subscriptions and their public entitlements
  const invalidatePremiumStatus = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getSubscriptionsQueryKey(ownerAddress) });
    queryClient.invalidateQueries({ queryKey: getPremiumEntitlementsQueryKey(ownerAddress) });
  }, [queryClient, ownerAddress]);

  // On mount, resume polling if there's a pending payment from a previous page load
  useEffect(() => {
    if (!isAuthenticated) return;

    const pendingPayment = loadPendingPayment(ownerAddress);
    if (!pendingPayment) return;

    setStatus('confirming');

    pollPaymentStatus(pendingPayment.paymentId, pendingPayment.expiresAt)
      .then((finalStatus) => {
        clearPendingPayment();

        if (finalStatus.status === 'confirmed') {
          setStatus('confirmed');
          invalidatePremiumStatus();
          toast.success(t('premium.checkout.payment_confirmed'));
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
  }, [ownerAddress, isAuthenticated, invalidatePremiumStatus, t]);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan || !selectedPaymentToken) throw new Error(t('premium.checkout.payment_failed'));

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

      if (
        !(await hasSufficientTokenBalance(ownerAddress, selectedPlan, selectedPaymentChainId, selectedPaymentToken))
      ) {
        throw new Error(
          t('premium.checkout.insufficient_balance', {
            amount: selectedPlan.priceUsdCents / 100,
            token: selectedPaymentToken.symbol,
            chainName: getChainName(selectedPaymentChainId),
          }),
        );
      }

      const payment = await ky
        .post('/api/premium/payments', {
          json: {
            planId: selectedPlan.id,
            chainId: selectedPaymentChainId,
            tokenSymbol: selectedPaymentToken.symbol,
          },
        })
        .json<PendingPayment>();

      analytics.track('Subscription Payment Created', {
        paymentId: payment.paymentId,
        planId: payment.planId,
        chainId: payment.chainId,
        tokenSymbol: payment.token.symbol,
        amountUsd: payment.amountUsdCents / 100,
      });

      // Step 2: Switch chain and send ERC20 transfer
      setStatus('paying');

      const walletClient = await ensureWalletClient(payment.chainId);

      const connectedAddress = walletClient.account?.address;
      if (!connectedAddress || !isAddressEqual(connectedAddress, ownerAddress)) {
        throw new Error(t('premium.checkout.wrong_wallet_error', { address: ownerAddress }));
      }

      const hash = await walletClient.writeContract({
        account: walletClient.account!,
        chain: walletClient.chain,
        address: payment.token.address,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [payment.recipientAddress, usdCentsToTokenUnits(payment.amountUsdCents, payment.token.decimals)],
        kzg: undefined,
      });

      displayTransactionSubmittedToast(payment.chainId, hash);

      analytics.track('Subscription Payment Sent', {
        paymentId: payment.paymentId,
        planId: payment.planId,
        chainId: payment.chainId,
        tokenSymbol: payment.token.symbol,
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
            ? t('premium.checkout.payment_expired', { token: payment.token.symbol })
            : t('premium.checkout.payment_status_error', { status: finalStatus.status });
        throw new Error(errorMessage);
      }

      analytics.track('Subscription Purchased', {
        paymentId: payment.paymentId,
        planId: payment.planId,
        chainId: payment.chainId,
        tokenSymbol: payment.token.symbol,
        amountUsd: payment.amountUsdCents / 100,
      });

      return finalStatus;
    },
    onSuccess: () => {
      setStatus('confirmed');
      invalidatePremiumStatus();
      toast.success(t('premium.checkout.payment_confirmed'));
    },
    onError: (error) => {
      setStatus('failed');
      // A failed chain switch already showed its own error
      if (!(error instanceof SwitchChainHandledError)) {
        toast.error(parseErrorMessage(error) || t('premium.checkout.payment_failed'));
      }
      analytics.track('Subscription Payment Failed', {
        planId: selectedPlan?.id,
        chainId: selectedPaymentChainId,
        tokenSymbol: selectedPaymentToken?.symbol,
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
    error:
      subscribeMutation.error && !(subscribeMutation.error instanceof SwitchChainHandledError)
        ? parseErrorMessage(subscribeMutation.error)
        : null,
    reset,
  };
};
