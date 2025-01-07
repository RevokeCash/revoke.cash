'use client';

import {
  type OnUpdate,
  type TokenAllowanceData,
  getAllowanceKey,
  prepareRevokeAllowance,
  revokeAllowance,
  wrapRevoke,
} from 'lib/utils/allowances';
import {
  mapTransactionRequestToEip5792Call,
  mapWalletCallReceiptToTransactionSubmitted,
  pollForCallsReceipts,
  walletSupportsEip5792,
} from 'lib/utils/eip5792';
import PQueue from 'p-queue';
import { useCallback, useEffect, useMemo } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import type { WalletClient } from 'viem';
import { eip5792Actions } from 'viem/experimental';
import { useWalletClient } from 'wagmi';
import { type TransactionStore, useTransactionStore } from '../../stores/transaction-store';

// Limit to 50 concurrent revokes to avoid wallets crashing
const REVOKE_QUEUE = new PQueue({ interval: 100, intervalCap: 1, concurrency: 50 });

export const useRevokeBatch2 = (allowances: TokenAllowanceData[], onUpdate: OnUpdate) => {
  const { results, getTransaction, updateTransaction } = useTransactionStore();

  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    allowances.forEach((allowance) => {
      updateTransaction(allowance, { status: 'not_started' }, false);
    });
  }, [allowances]);

  const { execute: revoke, loading: isSubmitting } = useAsyncCallback(async () => {
    if (await walletSupportsEip5792(walletClient!)) {
      await batchRevokeUsingEip5792(allowances, walletClient!, getTransaction, updateTransaction, onUpdate);
    } else {
      await batchRevokeUsingQueuedTransactions(allowances, walletClient!, getTransaction, updateTransaction, onUpdate);
    }
  });

  const pause = useCallback(() => {
    REVOKE_QUEUE.clear();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies(results): updated results mean the memo is stale
  const relevantResults = useMemo(() => {
    return Object.fromEntries(allowances.map((allowance) => [getAllowanceKey(allowance), getTransaction(allowance)]));
  }, [allowances, results]);

  // biome-ignore lint/correctness/useExhaustiveDependencies(results): updated results mean the memo is stale
  const isRevoking = useMemo(() => {
    return allowances.some((allowance) => getTransaction(allowance).status === 'pending');
  }, [allowances, results]);

  // biome-ignore lint/correctness/useExhaustiveDependencies(results): updated results mean the memo is stale
  const isAllConfirmed = useMemo(() => {
    return allowances.every((allowance) => getTransaction(allowance).status === 'confirmed');
  }, [allowances, results]);

  return { revoke, pause, results: relevantResults, isSubmitting, isRevoking, isAllConfirmed };
};

const batchRevokeUsingEip5792 = async (
  allowances: TokenAllowanceData[],
  walletClient: WalletClient,
  getTransaction: TransactionStore['getTransaction'],
  updateTransaction: TransactionStore['updateTransaction'],
  onUpdate: OnUpdate,
) => {
  const extendedWalletClient = walletClient.extend(eip5792Actions());

  // TODO: What if estimategas fails (should skip 1 and revoke others)
  const calls = await Promise.all(
    allowances.map(async (allowance) => {
      const transactionRequest = await prepareRevokeAllowance(walletClient, allowance);
      if (!transactionRequest) return;
      return mapTransactionRequestToEip5792Call(transactionRequest);
    }),
  );

  const batchPromise = extendedWalletClient.sendCalls({
    account: walletClient.account!,
    chain: walletClient.chain!,
    calls,
  });

  await Promise.race([
    Promise.all(
      allowances.map(async (allowance, index) => {
        // Skip if already confirmed or pending
        if (['confirmed', 'pending'].includes(getTransaction(allowance).status)) return;

        const revoke = wrapRevoke(
          allowance,
          async () => {
            const id = await batchPromise;
            const { receipts } = await pollForCallsReceipts(id, extendedWalletClient);

            if (receipts?.length === 1) {
              return mapWalletCallReceiptToTransactionSubmitted(allowance, receipts[0], onUpdate);
            }

            if (!receipts?.[index]) {
              throw new Error('An error occurred related to EIP5792 batch calls');
            }

            return mapWalletCallReceiptToTransactionSubmitted(allowance, receipts[index], onUpdate);
          },
          updateTransaction,
        );

        await REVOKE_QUEUE.add(revoke);
      }),
    ),
    REVOKE_QUEUE.onIdle(),
  ]);
};

const batchRevokeUsingQueuedTransactions = async (
  allowances: TokenAllowanceData[],
  walletClient: WalletClient,
  getTransaction: TransactionStore['getTransaction'],
  updateTransaction: TransactionStore['updateTransaction'],
  onUpdate: OnUpdate,
) => {
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
};
