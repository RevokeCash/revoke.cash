'use client';

import { getAllowanceKey, type OnUpdate, type TokenAllowanceData } from '@revoke.cash/core/allowances';
import { TransactionType } from '@revoke.cash/core/types';
import { isUserRejectionError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { FEE_SPONSORS, isZeroFeeDollarAmount } from 'components/allowances/controls/batch-revoke/fee';
import { revokeAllowance, trackRevokeTransaction } from 'lib/allowances';
import { recordBatchRevoke, trackBatchRevoke } from 'lib/allowances/batch-revoke';
import { useTranslations } from 'next-intl';
import type PQueue from 'p-queue';
import { toast } from 'react-toastify';
import { usePublicClient } from 'wagmi';
import { useTransactionStore, wrapTransaction } from '../../stores/transaction-store';
import { useAddress } from '../page-context/AddressIdentityContext';
import { useEnsureWalletClient } from './ensureWalletClient';
import { useFeePayment } from './useFeePayment';

export const useRevokeBatchQueuedTransactions = (allowances: TokenAllowanceData[], onUpdate: OnUpdate) => {
  const t = useTranslations();
  const { getTransaction, updateTransaction } = useTransactionStore();
  const { address, isPremium } = useAddress();
  // Get chainId from the first allowance (all selected allowances should be from the same chain)
  const chainId = allowances[0]?.chainId ?? 1;
  const { sendFeePayment } = useFeePayment(chainId);
  const { ensureWalletClient } = useEnsureWalletClient();
  const publicClient = usePublicClient({ chainId })!;

  const revoke = async (REVOKE_QUEUE: PQueue, feeDollarAmount: string) => {
    const walletClient = await ensureWalletClient(chainId);

    // Pay the fee before revoking the allowances
    if (!isZeroFeeDollarAmount(feeDollarAmount)) {
      allowances.forEach((allowance) => {
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

        allowances.forEach((allowance) => {
          updateTransaction(getAllowanceKey(allowance), { status: 'not_started' });
        });

        return;
      }
    }

    await Promise.race([
      Promise.all([
        ...allowances.map(async (allowance) => {
          // Skip if already confirmed or pending
          if (['confirmed', 'pending'].includes(getTransaction(getAllowanceKey(allowance)).status)) return;

          const revoke = wrapTransaction({
            transactionKey: getAllowanceKey(allowance),
            transactionType: TransactionType.REVOKE,
            executeTransaction: () => revokeAllowance(walletClient, allowance, publicClient, onUpdate),
            updateTransaction,
            trackTransaction: () => trackRevokeTransaction(allowance, 'queued'),
          });

          await REVOKE_QUEUE.add(revoke);
        }),
      ]),
      REVOKE_QUEUE.onIdle(),
    ]);

    // TODO: This still tracks if all revokes/the full batch gets rejected
    const sponsor = (isPremium ? 'Revoke Premium' : FEE_SPONSORS[chainId]?.name) ?? null;
    trackBatchRevoke(chainId, address, allowances, feeDollarAmount, 'queued', sponsor);
    // If the fee payment is zero, we record the batch revoke without a transaction hash, if there is a fee, it gets recorded when the fee payment is submitted
    if (isZeroFeeDollarAmount(feeDollarAmount) && allowances.length > 1) {
      recordBatchRevoke(chainId, null, address, feeDollarAmount, sponsor);
    }
  };

  return revoke;
};
