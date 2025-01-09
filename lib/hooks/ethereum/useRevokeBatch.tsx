'use client';

import { type OnUpdate, type TokenAllowanceData, getAllowanceKey } from 'lib/utils/allowances';
import { walletSupportsEip5792 } from 'lib/utils/eip5792';
import PQueue from 'p-queue';
import { useCallback, useEffect, useMemo } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { useWalletClient } from 'wagmi';
import { useTransactionStore } from '../../stores/transaction-store';
import { useRevokeBatchEip5792 } from './useRevokeBatchEip5792';
import { useRevokeBatchQueuedTransactions } from './useRevokeBatchQueuedTransactions';

// Limit to 50 concurrent revokes to avoid wallets crashing
const REVOKE_QUEUE = new PQueue({ interval: 100, intervalCap: 1, concurrency: 50 });

export const useRevokeBatch = (allowances: TokenAllowanceData[], onUpdate: OnUpdate) => {
  const { results, getTransaction, updateTransaction } = useTransactionStore();
  const revokeEip5792 = useRevokeBatchEip5792(allowances, onUpdate);
  const revokeQueuedTransactions = useRevokeBatchQueuedTransactions(allowances, onUpdate);

  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    allowances.forEach((allowance) => {
      updateTransaction(allowance, { status: 'not_started' }, false);
    });
  }, [allowances]);

  const { execute: revoke, loading: isSubmitting } = useAsyncCallback(async (tipAmount: string) => {
    if (await walletSupportsEip5792(walletClient!)) {
      await revokeEip5792(REVOKE_QUEUE, tipAmount);
    } else {
      await revokeQueuedTransactions(REVOKE_QUEUE, tipAmount);
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
