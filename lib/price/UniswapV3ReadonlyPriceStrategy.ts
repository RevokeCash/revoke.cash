import { UNISWAP_V3_POOL_ABI } from 'lib/abis';
import { TokenContract } from 'lib/interfaces';
import {
  Address,
  Hex,
  concat,
  encodeAbiParameters,
  getAddress,
  hexToNumber,
  keccak256,
  parseAbiParameters,
  parseUnits,
  slice,
} from 'viem';
import { UniswapV3PriceStrategy, UniswapV3PriceStrategyOptions } from './UniswapV3PriceStrategy';

export interface UniswapV3ReadonlyPriceStrategyOptions extends UniswapV3PriceStrategyOptions {
  poolBytecodeHash?: Hex;
}

// This strategy uses the "spot" price rather than getting a quote like the other UniswapV3PriceStrategy. This is
// more efficient because it can use Multicall3. However, it is less accurate because it does not fully take into
// account the liquidity of the pool.
export class UniswapV3ReadonlyPriceStrategy extends UniswapV3PriceStrategy {
  poolBytecodeHash: Hex;

  // Note that this strategy expects the "Factory contract" to be passed in the address field
  constructor(options: UniswapV3ReadonlyPriceStrategyOptions) {
    super(options);
    this.poolBytecodeHash =
      options.poolBytecodeHash ?? '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54';
  }

  public async calculateInversePrice(tokenContract: TokenContract): Promise<bigint> {
    // if (tokenContract.address !== '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' && tokenContract.address !== '0x6B175474E89094C44Da98b954EedeAC495271d0F') throw new Error('Not WETH');
    // console.log('aaa', 'hello')

    if (tokenContract.address === this.path.at(-1)) {
      return parseUnits(String(1), this.decimals);
    }

    const { publicClient } = tokenContract;
    const path =
      tokenContract.address === this.path.at(1) ? this.path.slice(1) : ([tokenContract.address, ...this.path] as Hex[]);

    const pairs: { token0: Address; token1: Address; fee: number }[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      if (path[i].length !== 42) continue;
      if (i > path.length - 3) break;

      const pair = { token0: path[i], token1: path[i + 2], fee: hexToNumber(path[i + 1]) };
      pairs.push(pair);
    }

    console.log('aaa pairs', pairs);

    const pairResults = await Promise.all(
      pairs.map(async (pair) => {
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
      }),
    );

    const result = pairResults.reduce((acc, { pair, liquidity, slot0 }) => {
      if (!hasEnoughLiquidity(liquidity)) throw new Error('Not enough liquidity');

      const [sqrtPriceX96] = slot0;
      const ratio = tokenSortsBefore(pair.token0, pair.token1)
        ? 2 ** 192 / Number(sqrtPriceX96) ** 2
        : Number(sqrtPriceX96) ** 2 / 2 ** 192;
      // const token0price = Number(sqrtPriceX96) ** 2 / 2 ** 192; // Ratio between token0 and token1
      // const token1price = 2 ** 192 / Number(sqrtPriceX96) ** 2; // Ratio between token1 and token0
      console.log('aaa ratio', ratio);
      // console.log('aaa token1price', token1price);

      return acc * ratio;
    }, 1);

    console.log('aaa res', result);
    return BigInt(Math.round(result * 10 ** this.decimals));
  }

  private calculatePairAddress(token0: Address, token1: Address, fee: number): Address {
    const [tokenA, tokenB] = tokenSortsBefore(token0, token1) ? [token0, token1] : [token1, token0];

    const salt = keccak256(encodeAbiParameters(parseAbiParameters('address, address, uint24'), [tokenA, tokenB, fee]));
    return getAddress(slice(keccak256(concat(['0xff', this.address, salt, this.poolBytecodeHash])), 12));
  }
}

// TODO: Check more than just > 10 liquidity
// TODO: We may need to solve the liquidity issue better in general for this star
const hasEnoughLiquidity = (liquidity: bigint): boolean => {
  return liquidity > 10n;
};

const tokenSortsBefore = (token0: Address, token1: Address): boolean => {
  return token0.toLowerCase() < token1.toLowerCase();
};
