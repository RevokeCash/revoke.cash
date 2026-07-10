'use client';

import {
  getAllowanceKey,
  type OnUpdate,
  prepareRevokeAllowance,
  type TokenAllowanceData,
} from '@revoke.cash/core/allowances';
import {
  type Eip5792Call,
  mapContractTransactionRequestToEip5792Call,
  mapTransactionRequestToEip5792Call,
  mapWalletCallReceiptToTransactionSubmitted,
} from '@revoke.cash/core/eip5792';
import { TransactionType } from '@revoke.cash/core/types';
import { chunkArray } from '@revoke.cash/core/utils';
import { isBatchSizeError, isNoFeeRequiredError } from '@revoke.cash/core/utils/errors';
import { throwIfExcessiveGas } from '@revoke.cash/core/wallet';
import { FEE_SPONSORS, isZeroFeeDollarAmount } from 'components/allowances/controls/batch-revoke/fee';
import { trackRevokeTransaction } from 'lib/allowances';
import { recordBatchRevoke, trackBatchRevoke } from 'lib/allowances/batch-revoke';
import { useTranslations } from 'next-intl';
import type PQueue from 'p-queue';
import type { Capabilities, EstimateContractGasParameters, Hash } from 'viem'; // viem has an issue with typing the capability. Until they fix it, we are manually importing it.
import { usePublicClient, useWalletClient } from 'wagmi';
import { useTransactionStore, wrapTransaction } from '../../stores/transaction-store';
import { useAddress } from '../page-context/AddressIdentityContext';
import { useFeePayment } from './useFeePayment';
import { useWalletCapabilities } from './useWalletCapabilities';

export const useRevokeBatchEip5792 = (allowances: TokenAllowanceData[], onUpdate: OnUpdate) => {
  const t = useTranslations();
  const { getTransaction, updateTransaction } = useTransactionStore();
  const { address, isPremium } = useAddress();
  // Get chainId from the first allowance (all selected allowances should be from the same chain)
  const chainId = allowances[0]?.chainId ?? 1;
  const { capabilities } = useWalletCapabilities(chainId);
  const { prepareFeePayment, trackFeePaid } = useFeePayment(chainId);

  // All selected allowances share the same chain, so a single client for `chainId` covers them all.
  const publicClient = usePublicClient({ chainId })!;

  const { data: walletClient } = useWalletClient();

  const revoke = async (
    REVOKE_QUEUE: PQueue,
    feeDollarAmount: string,
    maxBatchSize: number = Number.POSITIVE_INFINITY,
  ) => {
    if (!walletClient) {
      throw new Error(t('common.errors.messages.connect_wallet_to_supported_network'));
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
        const transactionRequest = await prepareRevokeAllowance(allowance, publicClient);

        const estimatedGas =
          transactionRequest.gas ??
          (await publicClient.estimateContractGas(transactionRequest as EstimateContractGasParameters));

        throwIfExcessiveGas(chainId, estimatedGas, allowance.token.address);

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

    if (!isZeroFeeDollarAmount(feeDollarAmount) && callsToSubmit.length > 0) {
      try {
        const feeTransaction = prepareFeePayment(feeDollarAmount);
        // Fee payment is always the first transaction in the batch so it cannot be "skipped"
        // To fix the indexes and to handle fee payment tracking, we also add an undefined allowance to the allowancesToSubmit array
        callsToSubmit.unshift(mapTransactionRequestToEip5792Call(feeTransaction));
        allowancesToSubmit.unshift(undefined);
      } catch (error) {
        if (!isNoFeeRequiredError(error)) throw error;
        console.log('No fee required, skipping fee payment');
      }
    }

    const callChunks = chunkArray(callsToSubmit, maxBatchSize);
    const allowanceChunks = chunkArray(allowancesToSubmit, maxBatchSize);

    try {
      const walletCapabilities = capabilities ?? ((await walletClient.getCapabilities()) as Capabilities);

      await Promise.all(
        callChunks.map(async (callsChunk, chunkIndex) => {
          const chunkPromise = walletClient.sendCalls({
            version: '2.0.0',
            account: walletClient.account!,
            chain: walletClient.chain!,
            calls: callsChunk,
            ...getPaymasterDetails(walletCapabilities, chainId),
          });

          const allowancesChunk = allowanceChunks[chunkIndex];

          await Promise.all(
            allowancesChunk.map(async (allowance, index) => {
              const transactionKey = allowance ? getAllowanceKey(allowance) : `fee-payment-${chainId}-${address}`;

              // Skip if already confirmed or pending
              if (['confirmed', 'pending'].includes(getTransaction(transactionKey).status)) return;

              const transactionType = allowance ? TransactionType.REVOKE : TransactionType.FEE;

              const trackTransaction = allowance
                ? () => trackRevokeTransaction(allowance, 'eip5792')
                : (transactionHash: Hash) => trackFeePaid(chainId, address, feeDollarAmount, transactionHash);

              const executeTransaction = async () => {
                const id = await chunkPromise;
                const { receipts } = await walletClient.waitForCallsStatus({ id: id.id, pollingInterval: 1000 });

                if (receipts?.length === 1) {
                  return mapWalletCallReceiptToTransactionSubmitted(receipts[0], publicClient, allowance, onUpdate);
                }

                if (!receipts?.[index]) {
                  console.log('receipts', receipts);
                  throw new Error(t('common.errors.messages.eip5792_batch_call_failed'));
                }

                return mapWalletCallReceiptToTransactionSubmitted(receipts[index], publicClient, allowance, onUpdate);
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
    const sponsor = (isPremium ? 'Revoke Premium' : FEE_SPONSORS[chainId]?.name) ?? null;
    trackBatchRevoke(chainId, address, allowancesToSubmit, feeDollarAmount, 'eip5792', sponsor);
    // If the fee payment is zero, we record the batch revoke without a transaction hash, if there is a fee, it gets recorded when the fee payment is submitted
    if (isZeroFeeDollarAmount(feeDollarAmount) && allowancesToSubmit.length > 1) {
      recordBatchRevoke(chainId, null, address, feeDollarAmount, sponsor);
    }
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

const SPONSORSHIP_POLICIES = JSON.parse(process.env.NEXT_PUBLIC_CANDIDE_SPONSORSHIP_POLICIES ?? '{}');
const CANDIDE_API_KEY = process.env.NEXT_PUBLIC_CANDIDE_API_KEY;

const getPaymasterDetails = (capabilities: Capabilities, chainId: number) => {
  const atomicStatus = capabilities[chainId]?.atomic?.status;
  const supportsAtomic = atomicStatus === 'supported' || atomicStatus === 'ready';
  const supportsPaymaster = capabilities[chainId]?.paymasterService?.supported === true;

  const includePaymaster = supportsAtomic && supportsPaymaster && Boolean(CANDIDE_API_KEY);
  if (!includePaymaster) return null;

  const sponsorshipPolicyId = SPONSORSHIP_POLICIES[chainId];
  const paymasterUrl = `https://api.candide.dev/api/v3/${chainId}/${CANDIDE_API_KEY}`;

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
