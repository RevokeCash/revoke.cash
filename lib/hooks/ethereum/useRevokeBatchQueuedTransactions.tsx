'use client';

import { isZeroFeeDollarAmount } from 'components/allowances/controls/batch-revoke/fee';
import { TransactionType } from 'lib/interfaces';
import {
  getAllowanceKey,
  type OnUpdate,
  revokeAllowance,
  type TokenAllowanceData,
  trackRevokeTransaction,
} from 'lib/utils/allowances';
import { recordBatchRevoke, trackBatchRevoke } from 'lib/utils/batch-revoke';
import { isUserRejectionError, parseErrorMessage } from 'lib/utils/errors';
import { useTranslations } from 'next-intl';
import type PQueue from 'p-queue';
import { toast } from 'react-toastify';
import { useWalletClient } from 'wagmi';
import { useTransactionStore, wrapTransaction } from '../../stores/transaction-store';
import { useAddressPageContext } from '../page-context/AddressPageContext';
import { useFeePayment } from './useFeePayment';

export const useRevokeBatchQueuedTransactions = (allowances: TokenAllowanceData[], onUpdate: OnUpdate) => {
  const t = useTranslations();
  const { getTransaction, updateTransaction } = useTransactionStore();
  const { address, selectedChainId } = useAddressPageContext();
  const { sendFeePayment } = useFeePayment(selectedChainId);
  const { data: walletClient } = useWalletClient();

  const revoke = async (REVOKE_QUEUE: PQueue, feeDollarAmount: string) => {
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
            executeTransaction: () => revokeAllowance(walletClient!, allowance, onUpdate),
            updateTransaction,
            trackTransaction: () => trackRevokeTransaction(allowance, 'queued'),
          });

          await REVOKE_QUEUE.add(revoke);
        }),
      ]),
      REVOKE_QUEUE.onIdle(),
    ]);

    // TODO: This still tracks if all revokes/the full batch gets rejected
    // If the fee payment is zero, we record the batch revoke without a transaction hash, if there is a fee, it gets recorded when the fee payment is submitted
    if (isZeroFeeDollarAmount(feeDollarAmount)) recordBatchRevoke(selectedChainId, null, feeDollarAmount);
    trackBatchRevoke(selectedChainId, address, allowances, feeDollarAmount, 'queued');
  };

  return revoke;
};
