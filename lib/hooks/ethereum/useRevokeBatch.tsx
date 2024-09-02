'use client';

import { AllowanceData, OnUpdate, TransactionStatus } from 'lib/interfaces';
import { getAllowanceKey, revokeAllowance } from 'lib/utils/allowances';
import { parseErrorMessage } from 'lib/utils/errors';
import PQueue from 'p-queue';
import { useEffect, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { Hash } from 'viem';
import { useWalletClient } from 'wagmi';

const REVOKE_QUEUE = new PQueue({ interval: 50, intervalCap: 1 });

interface RevokeResults {
  [key: string]: {
    status: TransactionStatus;
    error?: string;
    transactionHash?: Hash;
  };
}

export const useRevokeBatch = (allowances: AllowanceData[], onUpdate: OnUpdate) => {
  const initialResults = Object.fromEntries(
    allowances.map((allowance) => [getAllowanceKey(allowance), { status: 'not_started' as const }]),
  );

  const [results, setResults] = useState<RevokeResults>(initialResults);
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    setResults(initialResults);
  }, [allowances]);

  const { execute: revoke, loading: isLoading } = useAsyncCallback(async () => {
    await Promise.race([
      Promise.all(
        allowances.map(async (allowance) => {
          // Skip if already confirmed or pending
          if (['confirmed', 'pending'].includes(results[getAllowanceKey(allowance)].status)) return;

          await REVOKE_QUEUE.add(async () => {
            try {
              setResults((prev) => ({ ...prev, [getAllowanceKey(allowance)]: { status: 'pending' } }));

              const transactionHash = await revokeAllowance(walletClient, allowance, onUpdate);
              setResults((prev) => ({
                ...prev,
                [getAllowanceKey(allowance)]: { status: 'confirmed', transactionHash },
              }));
            } catch (error) {
              setResults((prev) => ({
                ...prev,
                [getAllowanceKey(allowance)]: { status: 'reverted', error: parseErrorMessage(error) },
              }));
            }
          });
        }),
      ),
      REVOKE_QUEUE.onIdle(),
    ]);
  });

  const pause = () => {
    REVOKE_QUEUE.clear();
  };

  return { revoke, pause, results, isLoading };
};
