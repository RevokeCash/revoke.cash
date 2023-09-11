import type { Balance, Filter, Log, LogsProvider } from 'lib/interfaces';
import type { Translate } from 'next-translate';
import { toast } from 'react-toastify';
import { isLogResponseSizeError, parseErrorMessage } from './errors';
import { resolveAvvyName, resolveEnsName, resolveUnsName } from './whois';
import {
  Abi,
  Address,
  ContractFunctionConfig,
  FormattedTransactionRequest,
  GetValue,
  Hex,
  PublicClient,
  WalletClient,
  getAddress,
  pad,
  slice,
} from 'viem';
import { Chain } from 'wagmi';
import { UnionOmit } from 'viem/dist/types/types/utils';
import { ChainId } from '@revoke.cash/chains';
import { track } from './analytics';

export const shortenAddress = (address?: string, characters: number = 6): string => {
  return address && `${address.substr(0, 2 + characters)}...${address.substr(address.length - characters, characters)}`;
};

export const shortenString = (name?: string, maxLength: number = 16): string | undefined => {
  if (!name) return undefined;
  if (name.length <= maxLength) return name;
  return `${name.substr(0, maxLength - 3).trim()}...`;
};

export const toFloat = (n: bigint, decimals: number = 0): string => {
  const full = (Number(n) / 10 ** decimals).toFixed(18).replace(/\.?0+$/, ''); // TODO: formatUnits

  const MAX_DISPLAY_DECIMALS = 3;
  const tooSmallPrefix = `0.${'0'.repeat(MAX_DISPLAY_DECIMALS)}`; // 3 decimals -> '0.000'
  const tooSmallReplacement = `< ${tooSmallPrefix.replace(/.$/, '1')}`; // 3 decimals -> '< 0.001'
  const rounded = Number(full)
    .toFixed(MAX_DISPLAY_DECIMALS)
    .replace(/\.?0+$/, '');

  return full.startsWith(tooSmallPrefix) ? tooSmallReplacement : rounded;
};

export const fromFloat = (floatString: string, decimals: number): bigint => {
  const sides = floatString.split('.');
  if (sides.length === 1) return BigInt(floatString.padEnd(decimals + floatString.length, '0'));
  if (sides.length > 2) return 0n;

  const numberAsString =
    sides[1].length > decimals ? sides[0] + sides[1].slice(0, decimals) : sides[0] + sides[1].padEnd(decimals, '0');

  return BigInt(numberAsString);
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

export const parseInputAddress = async (inputAddressOrName: string): Promise<Address | undefined> => {
  // If the input is an ENS name, validate it, resolve it and return it
  if (inputAddressOrName.endsWith('.eth')) {
    return await resolveEnsName(inputAddressOrName);
  }

  // If the input is an Avvy Domains name..
  if (inputAddressOrName.endsWith('.avax')) {
    return await resolveAvvyName(inputAddressOrName);
  }

  // Other domain-like inputs are interpreted as Unstoppable Domains
  if (inputAddressOrName.includes('.')) {
    return await resolveUnsName(inputAddressOrName);
  }

  // If the input is an address, validate it and return it
  try {
    return getAddress(inputAddressOrName.toLowerCase());
  } catch {
    return undefined;
  }
};

export const getBalanceText = (symbol: string, balance: Balance, decimals?: number) => {
  if (balance === 'ERC1155') return `(ERC1155)`;
  return `${toFloat(BigInt(balance), decimals)} ${symbol}`;
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
