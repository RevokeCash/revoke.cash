'use client';

import { type OnUpdate, type TokenAllowanceData, revokeAllowance, wrapRevoke } from 'lib/utils/allowances';
import type PQueue from 'p-queue';
import { useWalletClient } from 'wagmi';
import { useTransactionStore } from '../../stores/transaction-store';
import { useAddressPageContext } from '../page-context/AddressPageContext';
import { useDonate } from './useDonate';

export const useRevokeBatchQueuedTransactions = (allowances: TokenAllowanceData[], onUpdate: OnUpdate) => {
  const { getTransaction, updateTransaction } = useTransactionStore();
  const { selectedChainId } = useAddressPageContext();
  const { donate } = useDonate(selectedChainId, 'batch-revoke-tip');

  const { data: walletClient } = useWalletClient();

  const revoke = async (REVOKE_QUEUE: PQueue, tipAmount: string) => {
    await Promise.race([
      Promise.all(
        allowances.map(async (allowance) => {
          // Skip if already confirmed or pending
          if (['confirmed', 'pending'].includes(getTransaction(allowance).status)) return;

          const revoke = wrapRevoke(
            allowance,
            () => revokeAllowance(walletClient!, allowance, onUpdate),
            updateTransaction,
          );

          await REVOKE_QUEUE.add(revoke);
        }),
      ),
      REVOKE_QUEUE.onIdle(),
    ]);

    await donate(tipAmount);
  };

  return revoke;
};
