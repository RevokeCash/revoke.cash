import { DexContract, PriceStrategy, PriceStrategyType, TokenContract, isUniswapV2Contract } from 'lib/interfaces';
import { getChainPriceStrategies } from './chains';
import { isErc721Contract } from './tokens';
import { PublicClient, formatUnits, parseUnits } from 'viem';
import { ERC20_ABI, UNISWAP_V2_ROUTER_ABI } from 'lib/abis';
import { deduplicateArray, fixedPointMultiply } from '.';

const PRICE_BASE_AMOUNT = 1_000n;
const LIQUIDITY_CHECK_RATIO = 10n;
const ACCEPTABLE_SLIPPAGE = 0.4;

export const calculateTokenPrice = (tokensPerBase: bigint | null, tokenDecimals: number): number => {
  return tokensPerBase !== null
    ? Number(PRICE_BASE_AMOUNT) / Number.parseFloat(formatUnits(tokensPerBase, tokenDecimals))
    : null;
};

export const getNativeTokenPrice = async (chainId: number, publicClient: PublicClient): Promise<number> => {
  const [firstStrategy] = getChainPriceStrategies(chainId);

  if (!firstStrategy) return null;

  const tokensPerBase = await getTokensPerBase(chainId, {
    address: firstStrategy?.path?.[0],
    abi: ERC20_ABI,
    publicClient,
  });
  const price = calculateTokenPrice(tokensPerBase, 18);

  return price;
};

export const getTokensPerBase = async (chainId: number, tokenContract: TokenContract): Promise<bigint> => {
  const priceStrategies = getChainPriceStrategies(chainId);

  if (!priceStrategies || priceStrategies.length === 0) return null;
  if (isErc721Contract(tokenContract)) return null;

  const results = await Promise.all(
    priceStrategies.map((strategy) => getTokensPerBaseUsingStrategy(tokenContract, strategy)),
  );
  return bigintMax(...results.filter((price) => price !== null));
};

const getTokensPerBaseUsingStrategy = async (
  tokenContract: TokenContract,
  priceStrategy: PriceStrategy,
): Promise<bigint> => {
  if (tokenContract.address === priceStrategy.path.at(-1)) {
    return parseUnits(String(PRICE_BASE_AMOUNT), priceStrategy.decimals);
  }

  const contract = getDexContract(priceStrategy, tokenContract.publicClient);
  const path = deduplicateArray([tokenContract.address, ...priceStrategy.path]);

  try {
    if (!isUniswapV2Contract(contract)) return null;

    const [results, liquidityCheckResults] = await Promise.all([
      contract.publicClient.readContract({
        ...contract,
        functionName: 'getAmountsIn',
        args: [parseUnits(String(PRICE_BASE_AMOUNT), priceStrategy.decimals), path],
      }),
      contract.publicClient.readContract({
        ...contract,
        functionName: 'getAmountsIn',
        args: [parseUnits(String(PRICE_BASE_AMOUNT * LIQUIDITY_CHECK_RATIO), priceStrategy.decimals), path],
      }),
    ]);

    if (!hasEnoughLiquidity(results[0], liquidityCheckResults[0])) return null;

    return results[0];
  } catch (e) {
    return null;
  }
};

const getDexContract = (priceStrategy: PriceStrategy, publicClient: PublicClient): DexContract | null => {
  if (priceStrategy.type === PriceStrategyType.UNISWAP_V2) {
    const abi = UNISWAP_V2_ROUTER_ABI;
    const address = priceStrategy.dex;
    return { abi, address, publicClient };
  }

  return null;
};

const bigintMax = (...nums: bigint[]) => (nums.length > 0 ? nums.reduce((a, b) => (a > b ? a : b)) : null);

// The liquidity check is to prevent the price from being too volatile. If there is more than X% slippage,
// we assume that the price is too volatile and we don't use it.
const hasEnoughLiquidity = (normalValue: bigint, checkValue: bigint): boolean => {
  return normalValue * LIQUIDITY_CHECK_RATIO >= fixedPointMultiply(checkValue, 1 - ACCEPTABLE_SLIPPAGE, 18);
};
