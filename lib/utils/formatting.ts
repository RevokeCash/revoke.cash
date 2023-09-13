import { formatUnits } from 'viem';
import { isNullish } from '.';
import { Balance } from 'lib/interfaces';
import { fixedPointMultiply } from './math';

export const shortenAddress = (address?: string, characters: number = 6): string => {
  return address && `${address.substr(0, 2 + characters)}...${address.substr(address.length - characters, characters)}`;
};

export const shortenString = (name?: string, maxLength: number = 16): string | undefined => {
  if (!name) return undefined;
  if (name.length <= maxLength) return name;
  return `${name.substr(0, maxLength - 3).trim()}...`;
};

export const formatFixedPointBigInt = (
  n: bigint,
  decimals: number = 0,
  minDisplayDecimals: number = 0,
  maxDisplayDecimals: number = 3,
): string | undefined => {
  if (isNullish(n)) return undefined;

  const roundedNumberWithMaxDisplayDecimals = Number(formatUnits(n, decimals))
    .toFixed(maxDisplayDecimals)
    .replace(/\.?0+$/, '');

  const roundedNumberWithMinDisplayDecimals = Number(roundedNumberWithMaxDisplayDecimals).toFixed(
    Math.max(minDisplayDecimals, roundedNumberWithMaxDisplayDecimals.split('.')[1]?.length ?? 0),
  );

  const tooSmallPrefix = `0.${'0'.repeat(maxDisplayDecimals)}`; // 3 decimals -> '0.000'
  const tooSmallReplacement = `< ${tooSmallPrefix.replace(/.$/, '1')}`; // 3 decimals -> '< 0.001'

  return roundedNumberWithMaxDisplayDecimals.startsWith(tooSmallPrefix)
    ? tooSmallReplacement
    : addThousandsSeparators(roundedNumberWithMinDisplayDecimals);
};

export const parseFixedPointBigInt = (floatString: string, decimals: number): bigint => {
  const [integerPart, fractionalPart] = floatString.split('.');
  if (fractionalPart === undefined) return BigInt(floatString.padEnd(decimals + floatString.length, '0'));
  return BigInt(integerPart + fractionalPart.slice(0, decimals).padEnd(decimals, '0'));
};

export const formatBalance = (symbol: string, balance: Balance, decimals?: number) => {
  if (balance === 'ERC1155') return `(ERC1155)`;
  return `${formatFixedPointBigInt(balance, decimals)} ${symbol}`;
};

export const formatFiatBalance = (balance: Balance, price?: number, decimals?: number, fiatSign: string = '$') => {
  if (balance === 'ERC1155') return null;
  if (isNullish(price)) return null;
  return formatFiatAmount(Number(formatUnits(fixedPointMultiply(balance, price, decimals ?? 18), decimals)));
};

export const formatFiatAmount = (amount?: number, decimals: number = 2, fiatSign: string = '$'): string | null => {
  if (isNullish(amount)) return null;
  if (amount < 0.01 && amount > 0) return `< ${fiatSign}0.01`;
  return `${fiatSign}${addThousandsSeparators(amount.toFixed(decimals))}`;
};

const addThousandsSeparators = (number: string) => {
  const [integer, decimal] = number.split('.');
  const integerWithSeparators = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimal ? `${integerWithSeparators}.${decimal}` : integerWithSeparators;
};
