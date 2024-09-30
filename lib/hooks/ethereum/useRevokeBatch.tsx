'use client';

import { AllowanceData, OnUpdate } from 'lib/interfaces';
import { getAllowanceKey, revokeAllowance, wrapRevoke } from 'lib/utils/allowances';
import PQueue from 'p-queue';
import { useEffect, useMemo } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { useWalletClient } from 'wagmi';
import { useTransactionStore } from '../../stores/transaction-store';

const REVOKE_QUEUE = new PQueue({ interval: 100, intervalCap: 1 });

export const useRevokeBatch = (allowances: AllowanceData[], onUpdate: OnUpdate) => {
  const { results, getTransaction, updateTransaction } = useTransactionStore();

  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    allowances.forEach((allowance) => {
      updateTransaction(allowance, { status: 'not_started' }, false);
    });
  }, [allowances]);

  const { execute: revoke, loading: isLoading } = useAsyncCallback(async () => {
    await Promise.race([
      Promise.all(
        allowances.map(async (allowance) => {
          // Skip if already confirmed or pending
          if (['confirmed', 'pending'].includes(getTransaction(allowance).status)) return;

          const revoke = wrapRevoke(
            allowance,
            () => revokeAllowance(walletClient, allowance, onUpdate),
            updateTransaction,
          );

          await REVOKE_QUEUE.add(revoke);
        }),
      ),
      REVOKE_QUEUE.onIdle(),
    ]);
  });

  const pause = () => {
    REVOKE_QUEUE.clear();
  };

  const relevantResults = useMemo(() => {
    return Object.fromEntries(allowances.map((allowance) => [getAllowanceKey(allowance), getTransaction(allowance)]));
  }, [allowances, results]);

  return { revoke, pause, results: relevantResults, isLoading };
};
