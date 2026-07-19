'use client';

import { getAllowanceKey, type OnUpdate, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import { TransactionType } from '@revoke.cash/core/types';
import { isUserRejectionError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { FEE_SPONSORS, isZeroFeeDollarAmount } from 'components/allowances/controls/batch-revoke/fee';
import { revokeAllowance, trackRevokeTransaction } from 'lib/allowances';
import { recordBatchRevoke, trackBatchRevoke } from 'lib/allowances/batch-revoke';
import { isMobileDevice } from 'lib/utils/wallet';
import { useTranslations } from 'next-intl';
import PQueue from 'p-queue';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useConnection, usePublicClient } from 'wagmi';
import { useTransactionStore, wrapTransaction } from '../../stores/transaction-store';
import { useAddress } from '../page-context/AddressIdentityContext';
import { useEnsureWalletClient } from './ensureWalletClient';
import { useFeePayment } from './useFeePayment';

// Mobile wallets (connected through WalletConnect or as the wallet's in-app browser) can typically only
// handle a single request at a time, so we wait for the wallet to answer each transaction request before
// sending the next one. Other wallets get up to 50 concurrent requests to avoid crashing them.
export const createRevokeQueue = (sequential: boolean) => {
  if (sequential) return new PQueue({ concurrency: 1, interval: 500, intervalCap: 1 });
  return new PQueue({ concurrency: 50, interval: 100, intervalCap: 1 });
};

export type BatchRevokeProgress = {
  isPayingFee: boolean;
  current: number;
  total: number;
};

export const useRevokeBatchQueuedTransactions = (allowances: TokenAllowanceData[], onUpdate: OnUpdate) => {
  const t = useTranslations();
  const { getTransaction, updateTransaction } = useTransactionStore();
  const { address, isPremium } = useAddress();
  const { connector } = useConnection();
  // Get chainId from the first allowance (all selected allowances should be from the same chain)
  const chainId = allowances[0]?.chainId ?? 1;
  const { sendFeePayment } = useFeePayment(chainId);
  const { ensureWalletClient } = useEnsureWalletClient();
  const publicClient = usePublicClient({ chainId })!;

  const revokeQueueRef = useRef<PQueue | null>(null);
  const [progress, setProgress] = useState<BatchRevokeProgress | null>(null);

  const revoke = async (feeDollarAmount: string) => {
    const walletClient = await ensureWalletClient(chainId);

    const allowancesToRevoke = allowances.filter(
      (allowance) => !['confirmed', 'pending'].includes(getTransaction(getAllowanceKey(allowance)).status),
    );

    if (allowancesToRevoke.length === 0) return;

    const sequentialDispatch = connector?.type === 'walletConnect' || isMobileDevice();
    const revokeQueue = createRevokeQueue(sequentialDispatch);
    revokeQueueRef.current = revokeQueue;

    setProgress({
      isPayingFee: !isZeroFeeDollarAmount(feeDollarAmount),
      current: 1,
      total: allowancesToRevoke.length,
    });

    try {
      // Pay the fee before revoking the allowances
      if (!isZeroFeeDollarAmount(feeDollarAmount)) {
        allowancesToRevoke.forEach((allowance) => {
          updateTransaction(getAllowanceKey(allowance), { status: 'preparing' });
        });

        try {
          await sendFeePayment(feeDollarAmount);
        } catch (error) {
          if (isUserRejectionError(error)) {
            toast.error(t('common.toasts.fee_payment_rejected'));
          } else {
            toast.error(t('common.toasts.fee_payment_failed', { message: parseErrorMessage(error) }));
          }

          console.error(error);

          return;
        } finally {
          setProgress((previous) => previous && { ...previous, isPayingFee: false });
        }
      }

      await Promise.race([
        Promise.all([
          ...allowancesToRevoke.map(async (allowance) => {
            // Skip if the allowance was confirmed or became pending in the meantime
            if (['confirmed', 'pending'].includes(getTransaction(getAllowanceKey(allowance)).status)) return;

            const revoke = wrapTransaction({
              transactionKey: getAllowanceKey(allowance),
              transactionType: TransactionType.REVOKE,
              executeTransaction: () => revokeAllowance(walletClient, allowance, publicClient, onUpdate),
              updateTransaction,
              trackTransaction: () => trackRevokeTransaction(allowance, 'queued'),
            });

            await revokeQueue.add(revoke);
            setProgress(
              (previous) => previous && { ...previous, current: Math.min(previous.current + 1, previous.total) },
            );
          }),
        ]),
        revokeQueue.onIdle(),
      ]);
    } finally {
      allowancesToRevoke.forEach((allowance) => {
        if (getTransaction(getAllowanceKey(allowance)).status === 'preparing') {
          updateTransaction(getAllowanceKey(allowance), { status: 'not_started' });
        }
      });

      setProgress(null);
    }

    // TODO: This still tracks if all revokes/the full batch gets rejected
    const sponsor = (isPremium ? 'Revoke Premium' : FEE_SPONSORS[chainId]?.name) ?? null;
    trackBatchRevoke(chainId, address, allowances, feeDollarAmount, 'queued', sponsor);
    // If the fee payment is zero, we record the batch revoke without a transaction hash, if there is a fee, it gets recorded when the fee payment is submitted
    if (isZeroFeeDollarAmount(feeDollarAmount) && allowances.length > 1) {
      recordBatchRevoke(chainId, null, address, feeDollarAmount, sponsor);
    }
  };

  const pause = useCallback(() => {
    revokeQueueRef.current?.clear();
  }, []);

  return { revoke, progress, pause };
};
