import { Filter, Log } from '@ethersproject/abstract-provider';
import { BigNumber, BigNumberish } from 'ethers';
import { getAddress, hexDataSlice } from 'ethers/lib/utils';
import { LogsProvider } from 'lib/interfaces';
import { resolveEnsName, resolveUnsName } from './whois';

export function shortenAddress(address?: string): string {
  return address && `${address.substr(0, 6)}...${address.substr(address.length - 4, 4)}`;
}

export function compareBN(a: BigNumberish, b: BigNumberish): number {
  a = BigNumber.from(a);
  b = BigNumber.from(b);
  const diff = a.sub(b);
  return diff.isZero() ? 0 : diff.lt(0) ? -1 : 1;
}

export function toFloat(n: number, decimals: number): string {
  return (n / 10 ** decimals).toFixed(3);
}

export function fromFloat(floatString: string, decimals: number): string {
  const sides = floatString.split('.');
  if (sides.length === 1) return floatString.padEnd(decimals + floatString.length, '0');
  if (sides.length > 2) return '0';

  return sides[1].length > decimals
    ? sides[0] + sides[1].slice(0, decimals)
    : sides[0] + sides[1].padEnd(decimals, '0');
}

export const getLogs = async (
  provider: LogsProvider,
  baseFilter: Filter,
  fromBlock: number,
  toBlock: number
): Promise<Log[]> => {
  try {
    const filter = { ...baseFilter, fromBlock, toBlock };
    try {
      const result = await provider.getLogs(filter);
      return result;
    } catch (error) {
      const errorMessage = error?.error?.message ?? error?.data?.message ?? error?.message;
      if (errorMessage !== 'query returned more than 10000 results') {
        throw error;
      }

      const middle = fromBlock + Math.floor((toBlock - fromBlock) / 2);
      const leftPromise = getLogs(provider, baseFilter, fromBlock, middle);
      const rightPromise = getLogs(provider, baseFilter, middle + 1, toBlock);
      const [left, right] = await Promise.all([leftPromise, rightPromise]);
      return [...left, ...right];
    }
  } catch (error) {
    throw error;
  }
};

export const parseInputAddress = async (inputAddressOrName: string): Promise<string | undefined> => {
  // If the input is an ENS name, validate it, resolve it and return it
  if (inputAddressOrName.endsWith('.eth')) {
    return await resolveEnsName(inputAddressOrName);
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

export const getBalanceText = (symbol: string, balance: string, decimals?: number) => {
  if (balance === 'ERC1155') return `${symbol} (ERC1155)`;
  if (decimals !== undefined) return `${symbol}: ${toFloat(Number(balance), decimals)}`;
  return `${symbol}: ${String(balance)}`;
};

export const topicToAddress = (topic: string) => getAddress(hexDataSlice(topic, 12));
