import { ChainId } from '@revoke.cash/chains';
import type { AllowanceData, Filter, Log, LogsProvider } from 'lib/interfaces';
import type { Translate } from 'next-translate';
import { toast } from 'react-toastify';
import {
  Abi,
  Address,
  ContractFunctionConfig,
  FormattedTransactionRequest,
  GetValue,
  Hex,
  PublicClient,
  WalletClient,
  formatUnits,
  getAddress,
  pad,
  slice,
} from 'viem';
import { UnionOmit } from 'viem/types/utils';
import { Chain } from 'wagmi';
import { track } from './analytics';
import { isLogResponseSizeError, parseErrorMessage } from './errors';
import { bigintMin, fixedPointMultiply } from './math';

export const isNullish = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};

export const getLogs = async (logsProvider: LogsProvider, filter: Filter): Promise<Log[]> => {
  try {
    const result = await logsProvider.getLogs(filter);
    return result;
  } catch (error) {
    if (!isLogResponseSizeError(parseErrorMessage(error))) throw error;

    // If the block range is already a single block, we re-throw the error since we can't split it further
    if (filter.fromBlock === filter.toBlock) throw error;

    const middle = filter.fromBlock + Math.floor((filter.toBlock - filter.fromBlock) / 2);
    const leftPromise = getLogs(logsProvider, { ...filter, toBlock: middle });
    const rightPromise = getLogs(logsProvider, { ...filter, fromBlock: middle + 1 });
    const [left, right] = await Promise.all([leftPromise, rightPromise]);
    return [...left, ...right];
  }
};

export const calculateValueAtRisk = (allowance: AllowanceData): number => {
  if (!allowance.spender) return null;
  if (allowance.balance === 'ERC1155') return null;

  if (allowance.balance === 0n) return 0;
  if (isNullish(allowance.metadata.price)) return null;

  const amount = bigintMin(allowance.balance, allowance.amount);
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

export const deduplicateArray = <T>(array: T[], matcher: (a: T, b: T) => boolean = (a, b) => a === b): T[] => {
  return array.filter((a, i) => array.findIndex((b) => matcher(a, b)) === i);
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
  const WEIRD_NETWORKS = [
    ChainId.ZkSyncEraMainnet,
    ChainId.ZkSyncEraTestnet,
    ChainId.ArbitrumOne,
    ChainId.ArbitrumGoerli,
    ChainId.ArbitrumNova,
  ];

  const EXCESSIVE_GAS = WEIRD_NETWORKS.includes(chainId) ? 10_000_000n : 500_000n;

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

export const writeContractUnlessExcessiveGas = async <
  TAbi extends Abi | readonly unknown[] = Abi,
  TFunctionName extends string = string,
>(
  publicCLient: PublicClient,
  walletClient: WalletClient,
  transactionRequest: ContractTransactionRequest<TAbi, TFunctionName>,
) => {
  const estimatedGas = await publicCLient.estimateContractGas(transactionRequest);
  throwIfExcessiveGas(transactionRequest.chain!.id, transactionRequest.address, estimatedGas);
  return walletClient.writeContract({ ...transactionRequest, gas: estimatedGas });
};

// This is as "simple" as I was able to get this generic to be, considering it needs to work with viem's type inference
type ContractTransactionRequest<
  TAbi extends Abi | readonly unknown[] = Abi,
  TFunctionName extends string = string,
> = ContractFunctionConfig<TAbi, TFunctionName, 'payable' | 'nonpayable'> & {
  account: Address;
  chain: Chain;
  dataSuffix?: Hex;
} & UnionOmit<FormattedTransactionRequest<Chain>, 'from' | 'to' | 'data' | 'value'> &
  GetValue<TAbi, TFunctionName>;
