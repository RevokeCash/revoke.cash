'use client';

import type { TransactionSubmitted } from 'lib/interfaces';
import {
  type OnUpdate,
  type TokenAllowanceData,
  getAllowanceKey,
  prepareRevokeAllowance,
  wrapRevoke,
} from 'lib/utils/allowances';
import PQueue from 'p-queue';
import { useCallback, useEffect, useMemo } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import type { WalletCallReceipt, WalletClient, WriteContractParameters } from 'viem';
import { type Eip5792Actions, type GetCallsStatusReturnType, eip5792Actions } from 'viem/experimental';
import { useWalletClient } from 'wagmi';
import { useTransactionStore } from '../../stores/transaction-store';

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
    // TODO: What is estimategas fails
    const calls = await Promise.all(
      allowances.map(async (allowance) => {
        const transactionRequest = await prepareRevokeAllowance(walletClient!, allowance);
        if (!transactionRequest) return;
        return mapTransactionRequestToEip5792Call(transactionRequest);
      }),
    );

    const extendedWalletClient = walletClient!.extend(eip5792Actions());

    const batchPromise = extendedWalletClient.sendCalls({
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
                return walletCallReceiptToTransactionSubmitted(allowance, receipts[0], onUpdate);
              }

              if (!receipts?.[index]) {
                throw new Error('An error occurred related to EIP5792 batch calls');
              }

              return walletCallReceiptToTransactionSubmitted(allowance, receipts[index], onUpdate);
            },
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

const mapTransactionRequestToEip5792Call = (transactionRequest: WriteContractParameters) => {
  return {
    to: transactionRequest.address,
    abi: transactionRequest.abi,
    functionName: transactionRequest.functionName,
    args: transactionRequest.args,
    value: transactionRequest.value,
  };
};

const pollForCallsReceipts = async (id: string, walletClient: WalletClient & Eip5792Actions) => {
  return new Promise<GetCallsStatusReturnType>((resolve) => {
    const interval = setInterval(async () => {
      const res = await walletClient.getCallsStatus({ id });
      if (res.status === 'CONFIRMED') {
        clearInterval(interval);
        resolve(res);
      }
    }, 2000);

    return () => clearInterval(interval);
  });
};

const walletCallReceiptToTransactionSubmitted = (
  allowance: TokenAllowanceData,
  walletCallReceipt: WalletCallReceipt<bigint, 'success' | 'reverted'>,
  onUpdate: OnUpdate,
): TransactionSubmitted => {
  const awaitConfirmationAndUpdate = async () => {
    const receipt = await allowance.contract.publicClient.getTransactionReceipt({
      hash: walletCallReceipt.transactionHash,
    });
    onUpdate(allowance, undefined);
    return receipt;
  };

  return {
    hash: walletCallReceipt.transactionHash,
    confirmation: awaitConfirmationAndUpdate(),
  };
};
