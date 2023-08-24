import { DexContract, PriceStrategy, PriceStrategyType, TokenContract, isUniswapV2Contract } from 'lib/interfaces';
import { getChainPriceStrategies } from './chains';
import { isErc721Contract } from './tokens';
import { PublicClient, formatUnits, parseEther } from 'viem';
import { ERC20_ABI, UNISWAP_V2_ROUTER_ABI } from 'lib/abis';
import { deduplicateArray } from '.';

export const calculateTokenPrice = (tokensPerThousand: bigint | null, tokenDecimals: number): number => {
  return tokensPerThousand !== null ? 1000 / Number.parseFloat(formatUnits(tokensPerThousand, tokenDecimals)) : null;
};

export const getNativeTokenPrice = async (chainId: number, publicClient: PublicClient): Promise<number> => {
  const [firstStrategy] = getChainPriceStrategies(chainId);

  if (!firstStrategy) return null;

  const tokensPerThousand = await getTokensPerThousand(chainId, {
    address: firstStrategy?.path?.[0],
    abi: ERC20_ABI,
    publicClient,
  });
  const price = calculateTokenPrice(tokensPerThousand, 18);

  return price;
};

export const getTokensPerThousand = async (chainId: number, tokenContract: TokenContract): Promise<bigint> => {
  const priceStrategies = getChainPriceStrategies(chainId);

  if (!priceStrategies || priceStrategies.length === 0) return null;
  if (isErc721Contract(tokenContract)) return null;

  const results = await Promise.all(
    priceStrategies.map((strategy) => getTokensPerThousandUsingStrategy(tokenContract, strategy)),
  );
  return bigintMax(...results.filter((price) => price !== null));
};

const getTokensPerThousandUsingStrategy = async (
  tokenContract: TokenContract,
  priceStrategy: PriceStrategy,
): Promise<bigint> => {
  if (tokenContract.address === priceStrategy.path.at(-1)) return BigInt(1000e18);
  const contract = getDexContract(priceStrategy, tokenContract.publicClient);

  try {
    if (!isUniswapV2Contract(contract)) return null;

    const [tokensPerThousand] = await contract.publicClient.readContract({
      ...contract,
      functionName: 'getAmountsIn',
      args: [parseEther('1000'), deduplicateArray([tokenContract.address, ...priceStrategy.path])],
    });

    return tokensPerThousand;
  } catch {
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
