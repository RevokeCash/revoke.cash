'use client';

import { TransactionType } from 'lib/interfaces';
import { throwIfExcessiveGas } from 'lib/utils';
import {
  type OnUpdate,
  type TokenAllowanceData,
  getAllowanceKey,
  prepareRevokeAllowance,
  trackRevokeTransaction,
} from 'lib/utils/allowances';
import { trackBatchRevoke } from 'lib/utils/batch-revoke';
import {
  type Eip5792Call,
  mapContractTransactionRequestToEip5792Call,
  mapTransactionRequestToEip5792Call,
  mapWalletCallReceiptToTransactionSubmitted,
} from 'lib/utils/eip5792';
import type PQueue from 'p-queue';
import type { EstimateContractGasParameters, WalletCapabilities } from 'viem';
import { toHex } from 'viem';
import { useWalletClient } from 'wagmi';
import { useTransactionStore, wrapTransaction } from '../../stores/transaction-store';
import { useAddressPageContext } from '../page-context/AddressPageContext';
import { trackDonate, useDonate } from './useDonate';

const chainIdToNetwork: Record<number, string> = {
  1: 'ethereum',
  84532: 'base-sepolia',
  11155111: 'sepolia',
  10: 'optimism',
};
const chainIdToSponsorshipPolicyId: Record<number, string|undefined> = {
  1: process.env.NEXT_PUBLIC_ETHEREUM_SPONSORSHIP_POLICY_ID,
  84532: process.env.NEXT_PUBLIC_BASE_SEPOLIA_SPONSORSHIP_POLICY_ID,
  11155111: process.env.NEXT_PUBLIC_SEPOLIA_SPONSORSHIP_POLICY_ID,
  10: process.env.NEXT_PUBLIC_OPTIMISM_SPONSORSHIP_POLICY_ID,
};
const candidePaymasterVersion = "v3";

export const useRevokeBatchEip5792 = (allowances: TokenAllowanceData[], onUpdate: OnUpdate) => {
  const { getTransaction, updateTransaction } = useTransactionStore();
  const { address, selectedChainId } = useAddressPageContext();
  const { prepareDonate } = useDonate(selectedChainId, 'batch-revoke-tip');

  const { data: walletClient } = useWalletClient();

  const revoke = async (REVOKE_QUEUE: PQueue, tipDollarAmount: string) => {
    if (!walletClient) {
      throw new Error('Please connect your web3 wallet to a supported network');
    }

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

    if (tipDollarAmount && Number(tipDollarAmount) > 0 && calls.length > 0) {
      const donateTransaction = await prepareDonate(tipDollarAmount);
      calls.push(mapTransactionRequestToEip5792Call(donateTransaction));
    }

    const capabilities = await walletClient.getCapabilities();
    const atomicStatus = capabilities[selectedChainId]!.atomic?.status;
    const hasAtomic = atomicStatus === 'supported' || atomicStatus === 'ready';
    const hasPaymaster = capabilities[selectedChainId]!.paymasterService?.supported === true;

    // Build paymaster URL & policyId from env + maps
    const network = chainIdToNetwork[selectedChainId];
    const candideApiKey = process.env.NEXT_PUBLIC_CANDIDE_APY_KEY;
    const sponsorshipPolicyId = chainIdToSponsorshipPolicyId[selectedChainId];
    
    const includePaymaster = hasAtomic && hasPaymaster && network;

    const paymasterUrl = includePaymaster
      ? `https://api.candide.dev/paymaster/${candidePaymasterVersion}/${network}/${candideApiKey}`
      : undefined;    

    // **2. Conditionally include paymaster capabilities**
    const batchPromise = walletClient.sendCalls({
      version: '2.0.0',
      account: walletClient.account!,
      chain: walletClient.chain!,
      calls,
      // Only spread in the paymaster bits when supported
      ...(includePaymaster
        ? {
          capabilities: {
            paymasterService: {
              [toHex(selectedChainId)]: {
                url:      paymasterUrl,
                optional: true,
                context: {
                  sponsorshipPolicyId,
                },
              },
            },
          },
        }
        : {}),
    });

    await Promise.race([
      Promise.all(
        allowances.map(async (allowance, index) => {
          // Skip if already confirmed or pending
          if (['confirmed', 'pending'].includes(getTransaction(getAllowanceKey(allowance)).status)) return;

          const revoke = wrapTransaction({
            transactionKey: getAllowanceKey(allowance),
            transactionType: TransactionType.REVOKE,
            executeTransaction: async () => {
              // Check whether the revoke failed *before* even making it into wallet_sendCalls
              const settlement = callsSettled[index];
              if (settlement.status === 'rejected') throw settlement.reason;

              const id = await batchPromise;
              const { receipts } = await walletClient.waitForCallsStatus({ id: id.id, pollingInterval: 1000 });

              if (receipts?.length === 1) {
                return mapWalletCallReceiptToTransactionSubmitted(allowance, receipts[0], onUpdate);
              }

              const callIndex = getCallIndex(index, callsSettled);

              if (!receipts?.[callIndex]) {
                console.log('receipts', receipts);
                throw new Error('An error occurred related to EIP5792 batch calls');
              }

              return mapWalletCallReceiptToTransactionSubmitted(allowance, receipts[callIndex], onUpdate);
            },
            updateTransaction,
            trackTransaction: () => trackRevokeTransaction(allowance),
          });

          await REVOKE_QUEUE.add(revoke);
        }),
      ),
      REVOKE_QUEUE.onIdle(),
    ]);

    trackBatchRevoke(selectedChainId, address, allowances, tipDollarAmount, 'eip5792');
    trackDonate(selectedChainId, tipDollarAmount, 'batch-revoke-tip');
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
