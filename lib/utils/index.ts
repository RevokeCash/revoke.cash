import { ChainId } from '@revoke.cash/chains';
import type { AllowanceData, Log } from 'lib/interfaces';
import type { Translate } from 'next-translate';
import { toast } from 'react-toastify';
import {
  Address,
  Hash,
  Hex,
  PublicClient,
  TransactionNotFoundError,
  TransactionReceiptNotFoundError,
  WalletClient,
  WriteContractParameters,
  formatUnits,
  getAddress,
  pad,
  slice,
} from 'viem';
import { track } from './analytics';
import { bigintMin, fixedPointMultiply } from './math';

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isNullish = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

const calculateMaxAllowanceAmount = (allowance: AllowanceData) => {
  if (allowance.balance === 'ERC1155') {
    throw new Error('ERC1155 tokens are not supported');
  }

  if (allowance.amount) return allowance.amount;
  if (allowance.tokenId) return 1n;

  return allowance.balance;
};

export const calculateValueAtRisk = (allowance: AllowanceData): number => {
  if (!allowance.spender) return null;
  if (allowance.balance === 'ERC1155') return null;

  if (allowance.balance === 0n) return 0;
  if (isNullish(allowance.metadata.price)) return null;

  const allowanceAmount = calculateMaxAllowanceAmount(allowance);

  const amount = bigintMin(allowance.balance, allowanceAmount);
  const valueAtRisk = fixedPointMultiply(amount, allowance.metadata.price, allowance.metadata.decimals);
  const float = Number(formatUnits(valueAtRisk, allowance.metadata.decimals));

  return float;
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

export const writeToClipBoard = (text: string, t: Translate, displayToast: boolean = true) => {
  if (typeof navigator === 'undefined' || !navigator?.clipboard?.writeText) {
    toast.info(t('common:toasts.clipboard_failed'), { autoClose: 1000 });
  }

  navigator.clipboard.writeText(text);

  if (displayToast) {
    toast.info(t('common:toasts.clipboard_success'), { autoClose: 1000 });
  }
};

export const normaliseLabel = (label: string) => {
  return label.toLowerCase().replace(/[ -]/g, '_');
};

export const getWalletAddress = async (walletClient: WalletClient) => {
  const [address] = await walletClient.requestAddresses();
  return address;
};

export const throwIfExcessiveGas = (chainId: number, address: Address, estimatedGas: bigint) => {
  // Some networks do weird stuff with gas estimation, so "normal" transactions have much higher gas limits.
  const gasFactors = {
    [ChainId.ZkSyncMainnet]: 20n,
    [ChainId.ZkSyncSepoliaTestnet]: 20n,
    [ChainId.ArbitrumOne]: 20n,
    [ChainId.ArbitrumNova]: 20n,
    [ChainId.ArbitrumSepolia]: 20n,
    [ChainId.FrameTestnet]: 20n,
    [ChainId.Mantle]: 2_000n,
    [ChainId.MantleTestnet]: 2_000n,
  };

  const EXCESSIVE_GAS = 500_000n * (gasFactors[chainId] ?? 1n);

  // TODO: Translate this error message
  if (estimatedGas > EXCESSIVE_GAS) {
    console.error(`Gas limit of ${estimatedGas} is excessive`);

    // Track excessive gas usage so we can blacklist tokens
    // TODO: Use a different tool than analytics for this
    track('Excessive gas limit', { chainId, address, estimatedGas: estimatedGas.toString() });

    throw new Error(
      'This transaction has an excessive gas cost. It is most likely a spam token, so you do not need to revoke this approval.',
    );
  }
};

export const writeContractUnlessExcessiveGas = async (
  publicCLient: PublicClient,
  walletClient: WalletClient,
  transactionRequest: WriteContractParameters,
) => {
  const estimatedGas = await publicCLient.estimateContractGas(transactionRequest);
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
