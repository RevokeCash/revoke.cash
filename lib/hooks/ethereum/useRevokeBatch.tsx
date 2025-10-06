'use client';

import { getFeeDollarAmount } from 'components/allowances/controls/batch-revoke/fee';
import { getAllowanceKey, type OnUpdate, type TokenAllowanceData } from 'lib/utils/allowances';
import { walletSupportsEip5792 } from 'lib/utils/eip5792';
import { isAccountUpgradeRejectionError } from 'lib/utils/errors';
import PQueue from 'p-queue';
import { useCallback, useEffect, useMemo } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { useWalletClient } from 'wagmi';
import { isTransactionStatusLoadingState, useTransactionStore } from '../../stores/transaction-store';
import { useAddressPageContext } from '../page-context/AddressPageContext';
import { useRevokeBatchEip5792 } from './useRevokeBatchEip5792';
import { useRevokeBatchQueuedTransactions } from './useRevokeBatchQueuedTransactions';
import { useWalletCapabilities } from './useWalletCapabilities';

// Limit to 50 concurrent revokes to avoid wallets crashing
const REVOKE_QUEUE = new PQueue({ interval: 100, intervalCap: 1, concurrency: 50 });

export const useRevokeBatch = (allowances: TokenAllowanceData[], onUpdate: OnUpdate) => {
  const { selectedChainId } = useAddressPageContext();
  const { results, getTransaction, updateTransaction } = useTransactionStore();
  const walletCapabilities = useWalletCapabilities();
  const revokeEip5792 = useRevokeBatchEip5792(allowances, onUpdate);
  const revokeQueuedTransactions = useRevokeBatchQueuedTransactions(allowances, onUpdate);

  const feeDollarAmount = getFeeDollarAmount(selectedChainId, allowances.length).toFixed(2);

  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    allowances.forEach((allowance) => {
      updateTransaction(getAllowanceKey(allowance), { status: 'not_started' }, false);
    });
  }, [allowances]);

  const { execute: revoke, loading: isSubmitting } = useAsyncCallback(async (): Promise<void> => {
    const supportsEip5792 = walletCapabilities.isLoading
      ? await walletSupportsEip5792(walletClient!)
      : walletCapabilities.supportsEip5792;

    if (supportsEip5792 && hasMoreThanOneTransaction(allowances, feeDollarAmount)) {
      try {
        await revokeEip5792(REVOKE_QUEUE, feeDollarAmount);
      } catch (error) {
        // Fall back to queued transactions if the user rejected the account upgrade
        if (isAccountUpgradeRejectionError(error)) {
          await revokeQueuedTransactions(REVOKE_QUEUE, feeDollarAmount);
        }

        throw error;
      }
    } else {
      await revokeQueuedTransactions(REVOKE_QUEUE, feeDollarAmount);
    }
  });

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

  return {
    revoke,
    pause,
    results: relevantResults,
    isSubmitting,
    isRevoking,
    isAllConfirmed,
    feeDollarAmount,
  };
};

const hasMoreThanOneTransaction = (allowances: TokenAllowanceData[], feeDollarAmount: string) => {
  return Number(feeDollarAmount) > 0 && allowances.length > 1;
};
