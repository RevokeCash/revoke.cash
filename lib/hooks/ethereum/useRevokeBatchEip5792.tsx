'use client';

import { throwIfExcessiveGas } from 'lib/utils';
import { type OnUpdate, type TokenAllowanceData, prepareRevokeAllowance, wrapRevoke } from 'lib/utils/allowances';
import {
  type Eip5792Call,
  mapContractTransactionRequestToEip5792Call,
  mapTransactionRequestToEip5792Call,
  mapWalletCallReceiptToTransactionSubmitted,
  pollForCallsReceipts,
} from 'lib/utils/eip5792';
import type PQueue from 'p-queue';
import type { EstimateContractGasParameters } from 'viem';
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

    const callsSettled = await Promise.allSettled(
      allowances.map(async (allowance): Promise<Eip5792Call> => {
        const transactionRequest = await prepareRevokeAllowance(walletClient, allowance);

        const publicClient = allowance.contract.publicClient;
        const estimatedGas =
          transactionRequest.gas ??
          (await publicClient.estimateContractGas(transactionRequest as EstimateContractGasParameters));

        throwIfExcessiveGas(selectedChainId, allowance.owner, estimatedGas);

        return mapContractTransactionRequestToEip5792Call(transactionRequest);
      }),
    );

    const calls = callsSettled.filter((call) => call.status === 'fulfilled').map((call) => call.value);

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
              // Check whether the revoke failed *before* even making it into wallet_sendCalls
              const settlement = callsSettled[index];
              if (settlement.status === 'rejected') throw settlement.reason;

              const id = await batchPromise;
              const { receipts } = await pollForCallsReceipts(id, extendedWalletClient);

              if (receipts?.length === 1) {
                return mapWalletCallReceiptToTransactionSubmitted(allowance, receipts[0], onUpdate);
              }

              const callIndex = getCallIndex(index, callsSettled);

              if (!receipts?.[callIndex]) {
                throw new Error('An error occurred related to EIP5792 batch calls');
              }

              return mapWalletCallReceiptToTransactionSubmitted(allowance, receipts[callIndex], onUpdate);
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

const getCallIndex = (index: number, callsSettled: PromiseSettledResult<Eip5792Call>[]): number => {
  const numberOfFailedCallsBeforeIndex = callsSettled
    .slice(0, index)
    .filter((call) => call.status === 'rejected').length;

  const adjustedIndex = index - numberOfFailedCallsBeforeIndex;
  return adjustedIndex;
};
