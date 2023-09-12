import { ERC20_ABI, UNISWAP_V3_QUOTER_ABI } from 'lib/abis';
import { TokenContract } from 'lib/interfaces';
import { Address, Hex, PublicClient, concat, parseUnits } from 'viem';
import { PriceStrategy } from './PriceStrategy';
import { calculateTokenPrice } from './utils';

export interface UniswapV3PriceStrategyOptions {
  address: Address;
  path: Address[];
  decimals?: number;
}

const PRICE_BASE_AMOUNT = 1000n;
const LIQUIDITY_CHECK_RATIO = 10n;
const ACCEPTABLE_SLIPPAGE = 0.4;

export class UniswapV3PriceStrategy implements PriceStrategy {
  abi = UNISWAP_V3_QUOTER_ABI;
  address: Address;
  path: Address[];
  decimals: number;

  // Note: the first address (so second entry) in the path is assumed to be the wrapped native token
  constructor(options: UniswapV3PriceStrategyOptions) {
    this.address = options.address;
    this.path = options.path;
    this.decimals = options.decimals ?? 18;
  }

  public async calculateNativeTokenPrice(publicClient: PublicClient): Promise<number> {
    const wrappedNativeToken = this.path.at(1); // First entry is the fee, then the wrapped native token
    const inversePrice = await this.calculateInversePrice({
      address: wrappedNativeToken,
      abi: ERC20_ABI,
      publicClient,
    });
    const price = calculateTokenPrice(inversePrice, 18);
    return price;
  }

  public async calculateInversePrice(tokenContract: TokenContract): Promise<bigint> {
    if (tokenContract.address === this.path.at(-1)) {
      return parseUnits(String(1), this.decimals);
    }

    const { publicClient } = tokenContract;
    const path = tokenContract.address === this.path.at(1) ? this.path.slice(1) : [tokenContract.address, ...this.path];

    const results = await publicClient.simulateContract({
      address: this.address,
      abi: this.abi,
      functionName: 'quoteExactOutput',
      args: [concat(path.reverse()), parseUnits(String(PRICE_BASE_AMOUNT), this.decimals)],
    });

    const [amountIn, sqrtPriceX96AfterList] = results.result;

    if (!hasEnoughLiquidity(sqrtPriceX96AfterList)) throw new Error('Not enough liquidity');

    return amountIn / 1000n;
  }
}

// TODO: Figure out how to interpret the sqrtPriceX96AfterList
const hasEnoughLiquidity = (sqrtPriceX96AfterList: readonly bigint[]): boolean => {
  return true;
};
