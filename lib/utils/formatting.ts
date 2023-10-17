import { Balance } from 'lib/interfaces';
import { formatUnits } from 'viem';
import { isNullish } from '.';
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
  fixedPointBigInt: bigint,
  decimals: number = 0,
  minDisplayDecimals: number = 0,
  maxDisplayDecimals: number = 3,
): string | undefined => {
  if (isNullish(fixedPointBigInt)) return undefined;

  const float = Number(formatUnits(fixedPointBigInt, decimals)).toFixed(decimals);

  const tooSmallPrefix = `0.${'0'.repeat(maxDisplayDecimals)}`; // 3 decimals -> '0.000'
  const tooSmallReplacement = `< ${tooSmallPrefix.replace(/.$/, '1')}`; // 3 decimals -> '< 0.001'
  if (float.replace(/\.?0+$/, '').startsWith(tooSmallPrefix)) return tooSmallReplacement;

  return addThousandsSeparators(constrainDisplayedDecimals(float, minDisplayDecimals, maxDisplayDecimals));
};

const constrainDisplayedDecimals = (float: string, minDecimals: number, maxDecimals: number): string => {
  const floatWithMaxDecimals = Number(float)
    .toFixed(maxDecimals)
    .replace(/\.?0+$/, '');
  const fractionalPart = floatWithMaxDecimals.split('.')[1];
  return Number(floatWithMaxDecimals).toFixed(Math.max(minDecimals, fractionalPart?.length ?? 0));
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
