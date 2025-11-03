'use client';

import { isNonZeroFeeDollarAmount } from 'components/allowances/controls/batch-revoke/fee';
import { TransactionType } from 'lib/interfaces';
import { splitArray, throwIfExcessiveGas } from 'lib/utils';
import {
  getAllowanceKey,
  type OnUpdate,
  prepareRevokeAllowance,
  type TokenAllowanceData,
  trackRevokeTransaction,
} from 'lib/utils/allowances';
import { trackBatchRevoke } from 'lib/utils/batch-revoke';
import {
  type Eip5792Call,
  mapContractTransactionRequestToEip5792Call,
  mapTransactionRequestToEip5792Call,
  mapWalletCallReceiptToTransactionSubmitted,
} from 'lib/utils/eip5792';
import { isBatchSizeError, isNoFeeRequiredError } from 'lib/utils/errors';
import type PQueue from 'p-queue';
import type { Capabilities, EstimateContractGasParameters, Hash } from 'viem'; // viem has a issue with typing the capability. Until they fix it, we manually importing it.
import { useWalletClient } from 'wagmi';
import { useTransactionStore, wrapTransaction } from '../../stores/transaction-store';
import { useAddressPageContext } from '../page-context/AddressPageContext';
import { useFeePayment } from './useFeePayment';
import { useWalletCapabilities } from './useWalletCapabilities';

export const useRevokeBatchEip5792 = (allowances: TokenAllowanceData[], onUpdate: OnUpdate) => {
  const { getTransaction, updateTransaction } = useTransactionStore();
  const { address, selectedChainId } = useAddressPageContext();
  const { capabilities } = useWalletCapabilities();
  const { prepareFeePayment, trackFeePaid } = useFeePayment(selectedChainId);

  const { data: walletClient } = useWalletClient();

  const revoke = async (
    REVOKE_QUEUE: PQueue,
    feeDollarAmount: string,
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
        const transactionRequest = await prepareRevokeAllowance(allowance);

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
    const allowancesToSubmit: Array<TokenAllowanceData | undefined> = allowancesToRevoke.filter(
      (_, index) => callsSettled[index].status === 'fulfilled',
    );

    if (isNonZeroFeeDollarAmount(feeDollarAmount) && callsToSubmit.length > 0) {
      try {
        const feeTransaction = await prepareFeePayment(feeDollarAmount);
        // Fee payment is always the first transaction in the batch so it cannot be "skipped"
        // To fix the indexes and to handle fee payment tracking, we also add an undefined allowance to the allowancesToSubmit array
        callsToSubmit.unshift(mapTransactionRequestToEip5792Call(feeTransaction));
        allowancesToSubmit.unshift(undefined);
      } catch (error) {
        if (!isNoFeeRequiredError(error)) throw error;
        console.log('No fee required, skipping fee payment');
      }
    }

    const callChunks = splitArray(callsToSubmit, maxBatchSize);
    const allowanceChunks = splitArray(allowancesToSubmit, maxBatchSize);
    const globalPublicClient = allowancesToRevoke[0].contract.publicClient;

    try {
      const walletCapabilities = capabilities ?? ((await walletClient.getCapabilities()) as Capabilities);

      await Promise.all(
        callChunks.map(async (callsChunk, chunkIndex) => {
          const chunkPromise = walletClient.sendCalls({
            version: '2.0.0',
            account: walletClient.account!,
            chain: walletClient.chain!,
            calls: callsChunk,
            ...getPaymasterDetails(walletCapabilities, selectedChainId),
          });

          const allowancesChunk = allowanceChunks[chunkIndex];

          await Promise.all(
            allowancesChunk.map(async (allowance, index) => {
              const transactionKey = allowance
                ? getAllowanceKey(allowance)
                : `fee-payment-${selectedChainId}-${address}`;

              // Skip if already confirmed or pending
              if (['confirmed', 'pending'].includes(getTransaction(transactionKey).status)) return;

              const transactionType = allowance ? TransactionType.REVOKE : TransactionType.FEE;

              const trackTransaction = allowance
                ? () => trackRevokeTransaction(allowance)
                : (transactionHash: Hash) => trackFeePaid(selectedChainId, address, feeDollarAmount, transactionHash);

              const executeTransaction = async () => {
                const id = await chunkPromise;
                const { receipts } = await walletClient.waitForCallsStatus({ id: id.id, pollingInterval: 1000 });

                if (receipts?.length === 1) {
                  return mapWalletCallReceiptToTransactionSubmitted(
                    receipts[0],
                    globalPublicClient,
                    allowance,
                    onUpdate,
                  );
                }

                if (!receipts?.[index]) {
                  console.log('receipts', receipts);
                  throw new Error('An error occurred related to EIP5792 batch calls');
                }

                return mapWalletCallReceiptToTransactionSubmitted(
                  receipts[index],
                  globalPublicClient,
                  allowance,
                  onUpdate,
                );
              };

              const executeSingleTransaction = wrapTransaction({
                transactionKey,
                transactionType,
                executeTransaction,
                updateTransaction,
                trackTransaction,
              });

              await REVOKE_QUEUE.add(executeSingleTransaction);
            }),
          );
        }),
      );
    } catch (error) {
      if (isBatchSizeError(error)) {
        const newMaxBatchSize = getNewMaxBatchSize(maxBatchSize, callsToSubmit.length);
        console.log((error as Error).message, 'reducing batch size to', newMaxBatchSize);
        return revoke(REVOKE_QUEUE, feeDollarAmount, newMaxBatchSize);
      }

      throw error;
    }

    // TODO: This still tracks if all revokes/the full batch gets rejected
    trackBatchRevoke(selectedChainId, address, allowancesToSubmit, feeDollarAmount, 'eip5792');
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

const CANDIDE_NETWORK_NAMES: Record<number, string> = {
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

const SPONSORSHIP_POLICIES = JSON.parse(process.env.NEXT_PUBLIC_CANDIDE_SPONSORSHIP_POLICIES ?? '{}');
const CANDIDE_PAYMASTER_VERSION = 'v3';

const getPaymasterDetails = (capabilities: Capabilities, chainId: number) => {
  const atomicStatus = capabilities[chainId]?.atomic?.status;
  const supportsAtomic = atomicStatus === 'supported' || atomicStatus === 'ready';
  const supportsPaymaster = capabilities[chainId]?.paymasterService?.supported === true;

  const networkName = CANDIDE_NETWORK_NAMES[chainId];
  const candideApiKey = process.env.NEXT_PUBLIC_CANDIDE_API_KEY;

  const includePaymaster = supportsAtomic && supportsPaymaster && Boolean(networkName) && Boolean(candideApiKey);
  if (!includePaymaster) return null;

  const sponsorshipPolicyId = SPONSORSHIP_POLICIES[chainId];
  const paymasterUrl = `https://api.candide.dev/paymaster/${CANDIDE_PAYMASTER_VERSION}/${networkName}/${candideApiKey}`;

  return {
    capabilities: {
      paymasterService: {
        url: paymasterUrl,
        optional: true,
        context: {
          sponsorshipPolicyId,
        },
      },
    },
  };
};
