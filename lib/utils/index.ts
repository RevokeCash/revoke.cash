import { ChainId } from '@revoke.cash/chains';
import type { TransactionSubmitted } from 'lib/interfaces';
import ky from 'lib/ky';
import type { getTranslations } from 'next-intl/server';
import { toast } from 'react-toastify';
import {
  type Address,
  type EstimateContractGasParameters,
  type Hash,
  type Hex,
  type PublicClient,
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
  type WalletClient,
  type WriteContractParameters,
  getAddress,
  pad,
  slice,
} from 'viem';
import { analytics } from './analytics';
import type { Log, TokenEvent } from './events';

export const assertFulfilled = <T>(item: PromiseSettledResult<T>): item is PromiseFulfilledResult<T> => {
  return item.status === 'fulfilled';
};

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isNullish = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

export const topicToAddress = (topic: Hex) => getAddress(slice(topic, 12));
export const addressToTopic = (address: Address) => pad(address, { size: 32 }).toLowerCase() as Hex;

export const logSorterChronological = (a: Log, b: Log) => {
  if (a.blockNumber === b.blockNumber) {
    if (a.transactionIndex === b.transactionIndex) {
      return Number(a.logIndex - b.logIndex);
    }
    return Number(a.transactionIndex - b.transactionIndex);
  }
  return Number(a.blockNumber - b.blockNumber);
};

export const sortLogsChronologically = (logs: Log[]) => logs.sort(logSorterChronological);

export const sortTokenEventsChronologically = (events: TokenEvent[]) =>
  events.sort((a, b) => logSorterChronological(a.rawLog, b.rawLog));

// This is O(n*m) complexity, but it's unlikely to be a problem in practice in most cases m (unique contracts) is way
// smaller than n (total logs). The previous version of this function was O(n^2), which was a problem for accounts with
// many transfers.
export const deduplicateArray = <T>(array: readonly T[], matcher: (a: T, b: T) => boolean = (a, b) => a === b): T[] => {
  const result: T[] = [];

  for (const item of array) {
    if (!result.some((existingItem) => matcher(existingItem, item))) result.push(item);
  }

  return result;
};

export const deduplicateLogsByTopics = (logs: Log[], consideredIndexes: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3]) => {
  const matcher = (a: Log, b: Log) => {
    return a.address === b.address && consideredIndexes.every((index) => a.topics[index] === b.topics[index]);
  };

  return deduplicateArray(logs, matcher);
};

export const filterLogsByAddress = (logs: Log[], address: string) => {
  return logs.filter((log) => log.address === address);
};

export const filterLogsByTopics = (logs: Log[], topics: string[]) => {
  return logs.filter((log) => {
    return topics.every((topic, index) => !topic || topic === log.topics[index]);
  });
};

export const writeToClipBoard = (
  text: string,
  t: Awaited<ReturnType<typeof getTranslations<string>>>,
  displayToast: boolean = true,
) => {
  if (typeof navigator === 'undefined' || !navigator?.clipboard?.writeText) {
    toast.info(t('common.toasts.clipboard_failed'), { autoClose: 1000 });
  }

  navigator.clipboard.writeText(text);

  if (displayToast) {
    toast.info(t('common.toasts.clipboard_success'), { autoClose: 1000 });
  }
};

export const normaliseLabel = (label: string) => {
  return label.toLowerCase().replace(/[ -]/g, '_');
};

export const getWalletAddress = async (walletClient: WalletClient) => {
  const [address] = await walletClient.getAddresses();
  return address;
};

export const throwIfExcessiveGas = (chainId: number, address: Address, estimatedGas: bigint) => {
  // Some networks do weird stuff with gas estimation, so "normal" transactions have much higher gas limits.
  const gasFactors: Record<number, bigint> = {
    [ChainId.ArbitrumOne]: 20n,
    [ChainId.ArbitrumNova]: 20n,
    [ChainId.ArbitrumSepolia]: 20n,
    [ChainId.FrameTestnet]: 20n,
    [ChainId.Mantle]: 2_000n,
    [ChainId.MantleTestnet]: 2_000n,
    [ChainId.ZkSyncMainnet]: 20n,
    [ChainId.ZkSyncSepoliaTestnet]: 20n,
    [ChainId.ZERONetwork]: 20n,
  };

  const EXCESSIVE_GAS = 500_000n * (gasFactors[chainId] ?? 1n);

  // TODO: Translate this error message
  if (estimatedGas > EXCESSIVE_GAS) {
    console.error(`Gas limit of ${estimatedGas} is excessive`);

    // Track excessive gas usage so we can blacklist tokens
    // TODO: Use a different tool than analytics for this
    analytics.track('Excessive gas limit', { chainId, address, estimatedGas: estimatedGas.toString() });

    throw new Error(
      'This transaction has an excessive gas cost. It is most likely a spam token, so you do not need to revoke this approval.',
    );
  }
};

export const writeContractUnlessExcessiveGas = async (
  publicClient: PublicClient,
  walletClient: WalletClient,
  transactionRequest: WriteContractParameters,
) => {
  const estimatedGas =
    transactionRequest.gas ??
    (await publicClient.estimateContractGas(transactionRequest as EstimateContractGasParameters));
  throwIfExcessiveGas(transactionRequest.chain!.id, transactionRequest.address, estimatedGas);
  return walletClient.writeContract({ ...transactionRequest, gas: estimatedGas });
};

export const waitForTransactionConfirmation = async (hash: Hash, publicClient: PublicClient) => {
  try {
    return await publicClient.waitForTransactionReceipt({ hash });
  } catch (e) {
    // Workaround for Safe Apps, somehow they don't return the transaction receipt -- TODO: remove when fixed
    if (e instanceof TransactionNotFoundError || e instanceof TransactionReceiptNotFoundError) return;
    throw e;
  }
};

export const waitForSubmittedTransactionConfirmation = async (
  transactionSubmitted?: TransactionSubmitted | Promise<TransactionSubmitted | undefined>,
) => {
  const transaction = await transactionSubmitted;
  return transaction?.confirmation ?? null;
};

export const splitBlockRangeInChunks = (chunks: [number, number][], chunkSize: number): [number, number][] =>
  chunks.flatMap(([from, to]) =>
    to - from < chunkSize
      ? [[from, to]]
      : splitBlockRangeInChunks(
          [
            [from, from + chunkSize - 1],
            [from + chunkSize, to],
          ],
          chunkSize,
        ),
  );

// Normalise risk factors to match the format of other risk data sources (TODO: Remove once this is live and whois sources are updated)
export const normaliseRiskData = (riskData: any, sourceOverride: string) => {
  if (!riskData) return null;

  const riskFactors = (riskData?.riskFactors ?? []).map((riskFactor: any) => {
    if (typeof riskFactor === 'string') {
      const [type, source] = riskFactor.includes('blocklist_') ? riskFactor.split('_') : [riskFactor, sourceOverride];
      return { type, source };
    }
    return riskFactor;
  });

  const exploitRiskFactors = (riskData?.exploits ?? []).flatMap((exploit: string) => {
    if (typeof exploit === 'string') {
      return [{ type: 'exploit', source: sourceOverride, data: exploit }];
    }
    return [];
  });

  return { ...riskData, riskFactors: [...riskFactors, ...exploitRiskFactors] };
};

export const range = (length: number) => Array.from({ length }, (_, i) => i);

export const apiLogin = async () => {
  return ky
    .post('/api/login')
    .json<any>()
    .then((res) => !!res?.ok);
};
