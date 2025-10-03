import { UNISWAP_V3_POOL_ABI } from 'lib/abis';
import type { Erc20TokenContract } from 'lib/utils/tokens';
import {
  type Address,
  encodeAbiParameters,
  getCreate2Address,
  type Hex,
  hexToNumber,
  keccak256,
  parseAbiParameters,
} from 'viem';
import { UniswapV3PriceStrategy, type UniswapV3PriceStrategyOptions } from './UniswapV3PriceStrategy';
import { calculateTokenPrice } from './utils';

export interface UniswapV3ReadonlyPriceStrategyOptions extends UniswapV3PriceStrategyOptions {
  poolBytecodeHash?: Hex;
  liquidityParameters?: LiquidityParameters;
}

// TODO: This is a stopgap solution, need to fix liquidity stuff better
export interface LiquidityParameters {
  minLiquidity?: bigint;
}

interface Pair {
  token0: Address;
  token1: Address;
  fee: number;
}

// This strategy uses the "spot" price rather than getting a quote like the other UniswapV3PriceStrategy. This is
// more efficient because it can use Multicall3. However, it is less accurate because it does not fully take into
// account the liquidity of the pool.
export class UniswapV3ReadonlyPriceStrategy extends UniswapV3PriceStrategy {
  poolBytecodeHash: Hex;
  minLiquidity: bigint;

  // Note that this strategy expects the "Factory contract" to be passed in the address field
  constructor(options: UniswapV3ReadonlyPriceStrategyOptions) {
    super(options);
    this.poolBytecodeHash =
      options.poolBytecodeHash ?? '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54';
    this.minLiquidity = options.liquidityParameters?.minLiquidity ?? 10n ** 17n;
  }

  protected async calculateTokenPriceInternal(tokenContract: Erc20TokenContract): Promise<number | null> {
    if (tokenContract.address === this.path.at(-1)) {
      return 1;
    }

    const { publicClient } = tokenContract;
    const path =
      tokenContract.address === this.path.at(1) ? this.path.slice(1) : ([tokenContract.address, ...this.path] as Hex[]);

    const pairs: Pair[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      if (path[i].length !== 42) continue;
      if (i > path.length - 3) break;

      const pair = { token0: path[i], token1: path[i + 2], fee: hexToNumber(path[i + 1]) };
      pairs.push(pair);
    }

    const tokenDecimalPromise = publicClient.readContract({
      address: tokenContract.address,
      abi: tokenContract.abi,
      functionName: 'decimals',
    });

    const pairPromises = pairs.map(async (pair) => {
      const pairAddress = this.calculatePairAddress(pair.token0, pair.token1, pair.fee);

      const [liquidity, slot0] = await Promise.all([
        publicClient.readContract({
          address: pairAddress,
          abi: UNISWAP_V3_POOL_ABI,
          functionName: 'liquidity',
        }),
        publicClient.readContract({
          address: pairAddress,
          abi: UNISWAP_V3_POOL_ABI,
          functionName: 'slot0',
        }),
      ]);

      return { pair, liquidity, slot0 };
    });

    const [tokenDecimals, ...pairResults] = await Promise.all([tokenDecimalPromise, ...pairPromises]);

    const result = pairResults.reduce((acc, { pair, liquidity, slot0 }) => {
      if (!this.hasEnoughLiquidity(liquidity)) throw new Error('Not enough liquidity');

      const [sqrtPriceX96] = slot0;
      const ratio = tokenSortsBefore(pair.token0, pair.token1)
        ? 2 ** 192 / Number(sqrtPriceX96) ** 2
        : Number(sqrtPriceX96) ** 2 / 2 ** 192;

      return acc * ratio;
    }, 1);

    const inverseTokenPrice = BigInt(Math.round(result * 10 ** this.decimals));

    return calculateTokenPrice(inverseTokenPrice, tokenDecimals);
  }

  private calculatePairAddress(token0: Address, token1: Address, fee: number): Address {
    const [tokenA, tokenB] = tokenSortsBefore(token0, token1) ? [token0, token1] : [token1, token0];
    const salt = keccak256(encodeAbiParameters(parseAbiParameters('address, address, uint24'), [tokenA, tokenB, fee]));
    return getCreate2Address({ from: this.address, salt, bytecodeHash: this.poolBytecodeHash });
  }

  // TODO: We may need to solve the liquidity issue better in general for this strategy
  // TODO: I think we should be able to do something like dividing by the price
  // @ts-expect-error I just want to be able to override this function with the same name (should be fine)
  private hasEnoughLiquidity = (liquidity: bigint): boolean => {
    return liquidity > this.minLiquidity;
  };
}

const tokenSortsBefore = (token0: Address, token1: Address): boolean => {
  return token0.toLowerCase() < token1.toLowerCase();
};
