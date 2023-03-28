import type { BigNumberish } from 'ethers';
import { BigNumber, utils } from 'ethers';
import type { Filter, Log, LogsProvider } from 'lib/interfaces';
import type { Translate } from 'next-translate';
import { toast } from 'react-toastify';
import { isLogResponseSizeError } from './errors';
import { resolveAvvyName, resolveEnsName, resolveUnsName } from './whois';

export const shortenAddress = (address?: string): string => {
  return address && `${address.substr(0, 8)}...${address.substr(address.length - 6, 6)}`;
};

export const shortenString = (name?: string, maxLength: number = 16): string | undefined => {
  if (!name) return undefined;
  if (name.length <= maxLength) return name;
  return `${name.substr(0, maxLength - 3).trim()}...`;
};

export const compareBN = (a: BigNumberish, b: BigNumberish): number => {
  a = BigNumber.from(a);
  b = BigNumber.from(b);
  const diff = a.sub(b);
  return diff.isZero() ? 0 : diff.lt(0) ? -1 : 1;
};

export const toFloat = (n: BigNumberish, decimals: number = 0): string => {
  return (Number(n) / 10 ** decimals).toFixed(3).replace(/\.?0+$/, '');
};

export const fromFloat = (floatString: string, decimals: number): string => {
  const sides = floatString.split('.');
  if (sides.length === 1) return floatString.padEnd(decimals + floatString.length, '0');
  if (sides.length > 2) return '0';

  return sides[1].length > decimals
    ? sides[0] + sides[1].slice(0, decimals)
    : sides[0] + sides[1].padEnd(decimals, '0');
};

export const getLogs = async (provider: LogsProvider, filter: Filter): Promise<Log[]> => {
  try {
    const result = await provider.getLogs(filter);
    return result;
  } catch (error) {
    if (!isLogResponseSizeError(error)) throw error;

    // If the block range is already a single block, we re-throw the error since we can't split it further
    if (filter.fromBlock === filter.toBlock) throw error;

    const middle = filter.fromBlock + Math.floor((filter.toBlock - filter.fromBlock) / 2);
    const leftPromise = getLogs(provider, { ...filter, toBlock: middle });
    const rightPromise = getLogs(provider, { ...filter, fromBlock: middle + 1 });
    const [left, right] = await Promise.all([leftPromise, rightPromise]);
    return [...left, ...right];
  }
};

export const parseInputAddress = async (inputAddressOrName: string): Promise<string | undefined> => {
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
    return utils.getAddress(inputAddressOrName.toLowerCase());
  } catch {
    return undefined;
  }
};

export const getBalanceText = (symbol: string, balance: string, decimals?: number) => {
  if (balance === 'ERC1155') return `(ERC1155)`;
  return `${toFloat(balance, decimals)} ${symbol}`;
};

export const topicToAddress = (topic: string) => utils.getAddress(utils.hexDataSlice(topic, 12));

export const logSorterChronological = (a: Log, b: Log) => {
  if (a.blockNumber === b.blockNumber) {
    if (a.transactionIndex === b.transactionIndex) {
      return a.logIndex - b.logIndex;
    }
    return a.transactionIndex - b.transactionIndex;
  }
  return a.blockNumber - b.blockNumber;
};

export const sortLogsChronologically = (logs: Log[]) => logs.sort(logSorterChronological);

export const deduplicateArray = <T>(array: T[], matcher: (a: T, b: T) => boolean): T[] => {
  return array.filter((a, i) => array.findIndex((b) => matcher(a, b)) === i);
};

export const deduplicateLogsByTopics = (logs: Log[]) => {
  const matcher = (a: Log, b: Log) => {
    return (
      a.address === b.address &&
      a.topics[0] === b.topics[0] &&
      a.topics[1] === b.topics[1] &&
      a.topics[2] === b.topics[2] &&
      a.topics[3] === b.topics[3]
    );
  };

  return deduplicateArray(logs, matcher);
};

export const filterLogsByAddress = (logs: Log[], address: string) => {
  return logs.filter((log) => log.address === address);
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
