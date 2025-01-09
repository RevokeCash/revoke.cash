'use client';

import { type OnUpdate, type TokenAllowanceData, prepareRevokeAllowance, wrapRevoke } from 'lib/utils/allowances';
import {
  type Eip5792Call,
  mapContractTransactionRequestToEip5792Call,
  mapTransactionRequestToEip5792Call,
  mapWalletCallReceiptToTransactionSubmitted,
  pollForCallsReceipts,
} from 'lib/utils/eip5792';
import type PQueue from 'p-queue';
import { eip5792Actions } from 'viem/experimental';
import { useWalletClient } from 'wagmi';
import { useTransactionStore } from '../../stores/transaction-store';
import { useAddressPageContext } from '../page-context/AddressPageContext';
import { useDonate } from './useDonate';

export const useRevokeBatchEip5792 = (allowances: TokenAllowanceData[], onUpdate: OnUpdate) => {
  const { getTransaction, updateTransaction } = useTransactionStore();
  const { selectedChainId } = useAddressPageContext();
  const { prepareDonate } = useDonate(selectedChainId, 'batch-revoke-tip');

  const { data: walletClient } = useWalletClient();

  const revoke = async (REVOKE_QUEUE: PQueue, tipAmount: string) => {
    if (!walletClient) {
      throw new Error('Please connect your web3 wallet to a supported network');
    }

    const extendedWalletClient = walletClient.extend(eip5792Actions());

    // TODO: What if estimategas fails (should skip 1 and revoke others)
    const calls: Eip5792Call[] = await Promise.all(
      allowances.map(async (allowance) => {
        const transactionRequest = await prepareRevokeAllowance(walletClient, allowance);
        if (!transactionRequest) return;
        return mapContractTransactionRequestToEip5792Call(transactionRequest);
      }),
    );

    if (tipAmount && Number(tipAmount) > 0) {
      const donateTransaction = await prepareDonate(tipAmount);
      calls.push(mapTransactionRequestToEip5792Call(donateTransaction));
    }

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

  return revoke;
};
