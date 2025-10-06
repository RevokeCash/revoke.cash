'use client';

import { TransactionType } from 'lib/interfaces';
import {
  getAllowanceKey,
  type OnUpdate,
  revokeAllowance,
  type TokenAllowanceData,
  trackRevokeTransaction,
} from 'lib/utils/allowances';
import { trackBatchRevoke } from 'lib/utils/batch-revoke';
import type PQueue from 'p-queue';
import { useWalletClient } from 'wagmi';
import { useTransactionStore, wrapTransaction } from '../../stores/transaction-store';
import { useAddressPageContext } from '../page-context/AddressPageContext';
import { useFeePayment } from './useFeePayment';

export const useRevokeBatchQueuedTransactions = (allowances: TokenAllowanceData[], onUpdate: OnUpdate) => {
  const { getTransaction, updateTransaction } = useTransactionStore();
  const { address, selectedChainId } = useAddressPageContext();
  const { sendFeePayment } = useFeePayment(selectedChainId);
  const { data: walletClient } = useWalletClient();

  const revoke = async (REVOKE_QUEUE: PQueue, feeDollarAmount: string) => {
    await Promise.race([
      Promise.all([
        sendFeePayment(feeDollarAmount),
        ...allowances.map(async (allowance) => {
          // Skip if already confirmed or pending
          if (['confirmed', 'pending'].includes(getTransaction(getAllowanceKey(allowance)).status)) return;

          const revoke = wrapTransaction({
            transactionKey: getAllowanceKey(allowance),
            transactionType: TransactionType.REVOKE,
            executeTransaction: () => revokeAllowance(walletClient!, allowance, onUpdate),
            updateTransaction,
            trackTransaction: () => trackRevokeTransaction(allowance),
          });

          await REVOKE_QUEUE.add(revoke);
        }),
      ]),
      REVOKE_QUEUE.onIdle(),
    ]);

    trackBatchRevoke(selectedChainId, address, allowances, feeDollarAmount, 'queued');
  };

  return revoke;
};
