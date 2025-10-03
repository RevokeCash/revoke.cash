'use client';

import { getAllowanceKey, type OnUpdate, type TokenAllowanceData } from 'lib/utils/allowances';
import { walletSupportsEip5792 } from 'lib/utils/eip5792';
import { isAccountUpgradeRejectionError } from 'lib/utils/errors';
import PQueue from 'p-queue';
import { useCallback, useEffect, useMemo } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { useWalletClient } from 'wagmi';
import { isTransactionStatusLoadingState, useTransactionStore } from '../../stores/transaction-store';
import { useRevokeBatchEip5792 } from './useRevokeBatchEip5792';
import { useRevokeBatchQueuedTransactions } from './useRevokeBatchQueuedTransactions';
import { useWalletCapabilities } from './useWalletCapabilities';

// Limit to 50 concurrent revokes to avoid wallets crashing
const REVOKE_QUEUE = new PQueue({ interval: 100, intervalCap: 1, concurrency: 50 });

export const useRevokeBatch = (allowances: TokenAllowanceData[], onUpdate: OnUpdate) => {
  const { results, getTransaction, updateTransaction } = useTransactionStore();
  const walletCapabilities = useWalletCapabilities();
  const revokeEip5792 = useRevokeBatchEip5792(allowances, onUpdate);
  const revokeQueuedTransactions = useRevokeBatchQueuedTransactions(allowances, onUpdate);

  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    allowances.forEach((allowance) => {
      updateTransaction(getAllowanceKey(allowance), { status: 'not_started' }, false);
    });
  }, [allowances]);

  const { execute: revoke, loading: isSubmitting } = useAsyncCallback(
    async (tipDollarAmount: string): Promise<void> => {
      const supportsEip5792 = walletCapabilities.isLoading
        ? await walletSupportsEip5792(walletClient!)
        : walletCapabilities.supportsEip5792;

      if (supportsEip5792) {
        try {
          await revokeEip5792(REVOKE_QUEUE, tipDollarAmount);
        } catch (error) {
          // Fall back to queued transactions if the user rejected the account upgrade
          if (isAccountUpgradeRejectionError(error)) {
            await revokeQueuedTransactions(REVOKE_QUEUE, tipDollarAmount);
          }

          throw error;
        }
      } else {
        await revokeQueuedTransactions(REVOKE_QUEUE, tipDollarAmount);
      }
    },
  );

  const pause = useCallback(() => {
    REVOKE_QUEUE.clear();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies(results): updated results mean the memo is stale
  const relevantResults = useMemo(() => {
    return Object.fromEntries(
      allowances.map((allowance) => [getAllowanceKey(allowance), getTransaction(getAllowanceKey(allowance))]),
    );
  }, [allowances, results]);

  // biome-ignore lint/correctness/useExhaustiveDependencies(results): updated results mean the memo is stale
  const isRevoking = useMemo(() => {
    return allowances.some((allowance) =>
      isTransactionStatusLoadingState(getTransaction(getAllowanceKey(allowance)).status),
    );
  }, [allowances, results]);

  // biome-ignore lint/correctness/useExhaustiveDependencies(results): updated results mean the memo is stale
  const isAllConfirmed = useMemo(() => {
    return allowances.every((allowance) => getTransaction(getAllowanceKey(allowance)).status === 'confirmed');
  }, [allowances, results]);

  return { revoke, pause, results: relevantResults, isSubmitting, isRevoking, isAllConfirmed };
};
