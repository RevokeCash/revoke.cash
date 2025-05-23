'use client';

import { TransactionType } from 'lib/interfaces';
import { splitArray, throwIfExcessiveGas } from 'lib/utils';
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
import { useWalletClient } from 'wagmi';
import { useTransactionStore, wrapTransaction } from '../../stores/transaction-store';
import { useAddressPageContext } from '../page-context/AddressPageContext';
import { trackDonate, useDonate } from './useDonate';
import { useWalletCapabilities } from './useWalletCapabilities';

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
  const { capabilities } = useWalletCapabilities();
  const { prepareDonate } = useDonate(selectedChainId, 'batch-revoke-tip');

  const { data: walletClient } = useWalletClient();

  const revoke = async (
    REVOKE_QUEUE: PQueue,
    tipDollarAmount: string,
    maxBatchSize: number = Number.POSITIVE_INFINITY,
  ) => {
    if (!walletClient) {
      throw new Error('Please connect your web3 wallet to a supported network');
    }

    // Do not revoke allowances that are already confirmed, or that are already pending
    // We do retry revoking the allowances that are reverted, preparing or retrying
    const allowancesToRevoke = allowances.filter((allowance) => {
      const status = getTransaction(getAllowanceKey(allowance)).status;
      if (status === 'confirmed') return false;
      if (status === 'pending') return false;
      return true;
    });

    if (allowancesToRevoke.length === 0) {
      return;
    }

    const callsSettled = await Promise.allSettled(
      allowancesToRevoke.map(async (allowance): Promise<Eip5792Call> => {
        const transactionRequest = await prepareRevokeAllowance(walletClient, allowance);

        const publicClient = allowance.contract.publicClient;
        const estimatedGas =
          transactionRequest.gas ??
          (await publicClient.estimateContractGas(transactionRequest as EstimateContractGasParameters));

        throwIfExcessiveGas(selectedChainId, allowance.owner, estimatedGas);

        return mapContractTransactionRequestToEip5792Call(transactionRequest);
      }),
    );

    // Update the transaction status for calls that failed before they were submitted
    callsSettled.forEach((result, index) => {
      if (result.status !== 'rejected') return;
      const transactionKey = getAllowanceKey(allowancesToRevoke[index]);
      updateTransaction(transactionKey, { status: 'reverted', error: result.reason });
    });

    // We filter failed calls pre-emptively so that these calls are not included in the batch
    const callsToSubmit = callsSettled.filter((call) => call.status === 'fulfilled').map((call) => call.value);
    const allowancesToSubmit = allowancesToRevoke.filter((_, index) => callsSettled[index].status === 'fulfilled');

    if (tipDollarAmount && Number(tipDollarAmount) > 0 && callsToSubmit.length > 0) {
      const donateTransaction = await prepareDonate(tipDollarAmount);
      callsToSubmit.push(mapTransactionRequestToEip5792Call(donateTransaction));
    }

    const callChunks = splitArray(callsToSubmit, maxBatchSize);
    const allowanceChunks = splitArray(allowancesToSubmit, maxBatchSize);

    const walletCapabilities = capabilities ?? ((await walletClient.getCapabilities()) as Capabilities);

    const atomicStatus = walletCapabilities[selectedChainId]!.atomic?.status;
    const hasAtomic = atomicStatus === 'supported' || atomicStatus === 'ready';
    const hasPaymaster = walletCapabilities[selectedChainId]!.paymasterService?.supported === true;

    // Build paymaster URL & policyId from env + maps
    const network = chainIdToNetwork[selectedChainId];
    const candideApiKey = process.env.NEXT_PUBLIC_CANDIDE_API_KEY;
    const sponsorshipPolicyId = chainIdToSponsorshipPolicyId[selectedChainId];
    const includePaymaster = hasAtomic && hasPaymaster && network;

    const paymasterUrl = `https://api.candide.dev/paymaster/${candidePaymasterVersion}/${network}/${candideApiKey}`;
    console.log('paymasterUrl', paymasterUrl, sponsorshipPolicyId);

    try {
      await Promise.all(
        callChunks.map(async (callsChunk, chunkIndex) => {
          const chunkPromise = walletClient.sendCalls({
            version: '2.0.0',
            account: walletClient.account!,
            chain: walletClient.chain!,
            calls: callsChunk,
            // Only spread in the paymaster bits when supported
            ...(includePaymaster
              ? {
                  capabilities: {
                    paymasterService: {
                      url: paymasterUrl,
                      optional: true,
                      context: {
                        sponsorshipPolicyId,
                      },
                    },
                  },
                }
              : {}),
          });

          const allowancesChunk = allowanceChunks[chunkIndex];

          await Promise.all(
            allowancesChunk.map(async (allowance, index) => {
              // Skip if already confirmed or pending
              if (['confirmed', 'pending'].includes(getTransaction(getAllowanceKey(allowance)).status)) return;

              const revokeSingleAllowance = wrapTransaction({
                transactionKey: getAllowanceKey(allowance),
                transactionType: TransactionType.REVOKE,
                executeTransaction: async () => {
                  const id = await chunkPromise;
                  const { receipts } = await walletClient.waitForCallsStatus({ id: id.id, pollingInterval: 1000 });

                  if (receipts?.length === 1) {
                    return mapWalletCallReceiptToTransactionSubmitted(allowance, receipts[0], onUpdate);
                  }

                  if (!receipts?.[index]) {
                    console.log('receipts', receipts);
                    throw new Error('An error occurred related to EIP5792 batch calls');
                  }

                  return mapWalletCallReceiptToTransactionSubmitted(allowance, receipts[index], onUpdate);
                },
                updateTransaction,
                trackTransaction: () => trackRevokeTransaction(allowance),
              });

              await REVOKE_QUEUE.add(revokeSingleAllowance);
            }),
          );
        }),
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes('Batch size cannot exceed')) {
        const newMaxBatchSize = getNewMaxBatchSize(maxBatchSize, callsToSubmit.length);
        console.log(error.message, 'reducing batch size to', newMaxBatchSize);
        return revoke(REVOKE_QUEUE, tipDollarAmount, newMaxBatchSize);
      }
    }

    trackBatchRevoke(selectedChainId, address, allowancesToSubmit, tipDollarAmount, 'eip5792');
    trackDonate(selectedChainId, tipDollarAmount, 'batch-revoke-tip');
  };

  return revoke;
};

const getNewMaxBatchSize = (maxBatchSize: number, totalCalls: number) => {
  // If the current max batch size is larger than 10, we set it to 10
  // Otherwise, we divide the current max batch size by 2, with a minimum of 1
  const newBatchSizeBase = Math.min(Math.max(Math.floor(maxBatchSize / 2), 1), 10);

  // We try to find a more "equal" batch size so that e.g. 45 calls are split into 5 batches of 9 instead of 4 batches of 10 and 1 batch of 5
  const numberOfBatches = Math.ceil(totalCalls / newBatchSizeBase);
  const newBatchSize = Math.ceil(totalCalls / numberOfBatches);

  return newBatchSize;
};
