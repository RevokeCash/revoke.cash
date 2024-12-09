'use client';

import {
  type OnUpdate,
  type TokenAllowanceData,
  getAllowanceKey,
  revokeAllowance,
  wrapRevoke,
} from 'lib/utils/allowances';
import PQueue from 'p-queue';
import { useCallback, useEffect, useMemo } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { useWalletClient } from 'wagmi';
import { useTransactionStore } from '../../stores/transaction-store';

// Limit to 50 concurrent revokes to avoid wallets crashing
const REVOKE_QUEUE = new PQueue({ interval: 100, intervalCap: 1, concurrency: 50 });

export const useRevokeBatch = (allowances: TokenAllowanceData[], onUpdate: OnUpdate) => {
  const { results, getTransaction, updateTransaction } = useTransactionStore();

  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    allowances.forEach((allowance) => {
      updateTransaction(allowance, { status: 'not_started' }, false);
    });
  }, [allowances]);

  const { execute: revoke, loading: isSubmitting } = useAsyncCallback(async () => {
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
