import { ChainId } from '@revoke.cash/chains';
import type { Delegation } from 'lib/delegations/DelegatePlatform';
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
import analytics from './analytics';
import type { Log } from './events';

export const assertFulfilled = <T>(item: PromiseSettledResult<T>): item is PromiseFulfilledResult<T> => {
  return item.status === 'fulfilled';
};

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isNullish = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

export const delegationEquals = (a: Delegation, b: Delegation): boolean => {
  // Handle null/undefined cases
  if (isNullish(a) || isNullish(b)) return false;
  if (isNullish(a.delegator) || isNullish(a.delegate)) return false;
  if (isNullish(b.delegator) || isNullish(b.delegate)) return false;

  return (
    a.delegator === b.delegator &&
    a.delegate === b.delegate &&
    a.type === b.type &&
    a.contract === b.contract &&
    a.tokenId === b.tokenId &&
    a.platform === b.platform &&
    a.direction === b.direction
  );
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

export const sortTokenEventsChronologically = <T extends { rawLog: Log }>(events: T[]): T[] =>
  events.sort((a, b) => logSorterChronological(a.rawLog, b.rawLog));

// This is O(n) complexity because Set.has() and Set.add() are O(1), which is much faster than the previous
// iterations of this function, which were O(n^2) and later O(n*m). This doesn't matter for most cases, but for
// our calculate-potential-losses script, it makes a huge difference because we might be dealing with deduplicating
// 1m+ logs.
export const deduplicateArray = <T>(
  array: readonly T[],
  keyGenerator: (item: T) => string = (item) => `${item}`,
): T[] => {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of array) {
    const key = keyGenerator(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
};

export const deduplicateLogsByTopics = (logs: Log[], consideredIndexes: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3]) => {
  const keyGenerator = (log: Log) => {
    const topicsKey = log.topics
      .map((topic, index) => (consideredIndexes.includes(index as 0 | 1 | 2 | 3) ? topic : 'ignored'))
      .join('-');

    return `${log.address}-${topicsKey}`;
  };

  return deduplicateArray(logs, keyGenerator);
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
    [ChainId.ArbitrumNova]: 20n,
    [ChainId.ArbitrumSepolia]: 20n,
    [ChainId.FrameTestnet]: 20n,
    [ChainId.Mantle]: 2_000n,
    [ChainId.MantleTestnet]: 2_000n,
    [5031]: 10n, // Somnia
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
  // In a backend context, we do not need to login
  if (!isBrowser()) return true;

  return ky
    .post('/api/login')
    .json<any>()
    .then((res) => !!res?.ok);
};

export const isBrowser = () => typeof window !== 'undefined';

export type AccountType = 'EOA' | 'EIP7702 Account' | 'Smart Contract';
export const getAccountType = async (address: Address, publicClient: PublicClient): Promise<AccountType> => {
  const code = await publicClient.getCode({ address });
  if (isNullish(code) || code === '0x') return 'EOA';
  if (code.startsWith('0xef0100')) return 'EIP7702 Account';
  return 'Smart Contract';
};

export const splitArray = <T>(array: T[], chunkSize: number): T[][] => {
  const result: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }

  return result;
};
