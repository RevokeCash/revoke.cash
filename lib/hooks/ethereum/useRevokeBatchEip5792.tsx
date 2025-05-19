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
import type { Capabilities, EstimateContractGasParameters } from 'viem'; // viem has a issue with typing the capability. Until they fix it, we manually importing it.
import { toHex } from 'viem';
import { useWalletClient } from 'wagmi';
import { useTransactionStore, wrapTransaction } from '../../stores/transaction-store';
import { useAddressPageContext } from '../page-context/AddressPageContext';
import { trackDonate, useDonate } from './useDonate';

const chainIdToNetwork: Record<number, string> = {
  // Mainnet
  1: 'ethereum',
  10: 'optimism',
  56: 'bsc',
  100: 'gnosis',
  137: 'polygon',
  8453: 'base',
  42161: 'arbitrum',
  42220: 'celo',
  // Testnet
  11155111: 'sepolia',
  11155420: 'optimism-sepolia',
  80002: 'amoy',
  84532: 'base-sepolia',
  421614: 'arbitrum-sepolia',
};
const chainIdToSponsorshipPolicyId: Record<number, string | undefined> = {
  // Mainnets
  1: process.env.NEXT_PUBLIC_ETHEREUM_SPONSORSHIP_POLICY_ID,
  10: process.env.NEXT_PUBLIC_OPTIMISM_SPONSORSHIP_POLICY_ID,
  56: process.env.NEXT_PUBLIC_BSC_SPONSORSHIP_POLICY_ID,
  100: process.env.NEXT_PUBLIC_GNOSIS_SPONSORSHIP_POLICY_ID,
  137: process.env.NEXT_PUBLIC_POLYGON_SPONSORSHIP_POLICY_ID,
  8453: process.env.NEXT_PUBLIC_BASE_SPONSORSHIP_POLICY_ID,
  42161: process.env.NEXT_PUBLIC_ARBITRUM_SPONSORSHIP_POLICY_ID,
  42220: process.env.NEXT_PUBLIC_CELO_SPONSORSHIP_POLICY_ID,
  // Testnets
  11155111: process.env.NEXT_PUBLIC_SEPOLIA_SPONSORSHIP_POLICY_ID,
  11155420: process.env.NEXT_PUBLIC_OPTIMISM_SEPOLIA_SPONSORSHIP_POLICY_ID,
  80002: process.env.NEXT_PUBLIC_AMOY_SPONSORSHIP_POLICY_ID,
  84532: process.env.NEXT_PUBLIC_BASE_SEPOLIA_SPONSORSHIP_POLICY_ID,
  421614: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_SPONSORSHIP_POLICY_ID,
};
const candidePaymasterVersion = 'v3';

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

    const capabilities = (await walletClient.getCapabilities()) as Capabilities;

    const atomicStatus = capabilities[selectedChainId]!.atomic?.status;
    const hasAtomic = atomicStatus === 'supported' || atomicStatus === 'ready';
    const hasPaymaster = capabilities[selectedChainId]!.paymasterService?.supported === true;

    // Build paymaster URL & policyId from env + maps
    const network = chainIdToNetwork[selectedChainId];
    const candideApiKey = process.env.NEXT_PUBLIC_CANDIDE_API_KEY;
    const sponsorshipPolicyId = chainIdToSponsorshipPolicyId[selectedChainId];
    const includePaymaster = hasAtomic && hasPaymaster && network;

    const paymasterUrl = `https://api.candide.dev/paymaster/${candidePaymasterVersion}/${network}/${candideApiKey}`;

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
                  url: paymasterUrl,
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
