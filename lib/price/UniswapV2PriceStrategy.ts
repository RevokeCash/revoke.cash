import { ERC20_ABI, UNISWAP_V2_ROUTER_ABI } from 'lib/abis';
import { TokenContract } from 'lib/interfaces';
import { Abi, Address, PublicClient, parseUnits } from 'viem';
import { PriceStrategy } from './PriceStrategy';
import { calculateTokenPrice } from './utils';
import { fixedPointMultiply } from 'lib/utils/math';

export interface UniswapV2PriceStrategyOptions {
  address: Address;
  path: Address[];
  decimals?: number;
}

const PRICE_BASE_AMOUNT = 1000n;
const LIQUIDITY_CHECK_RATIO = 10n;
const ACCEPTABLE_SLIPPAGE = 0.4;

export class UniswapV2PriceStrategy implements PriceStrategy {
  abi: Abi = UNISWAP_V2_ROUTER_ABI;
  address: Address;
  path: Address[];
  decimals: number;

  // Note: the first address in the path is assumed to be the wrapped native token
  constructor(options: UniswapV2PriceStrategyOptions) {
    this.address = options.address;
    this.path = options.path;
    this.decimals = options.decimals ?? 18;
  }

  public async calculateNativeTokenPrice(publicClient: PublicClient): Promise<number> {
    const wrappedNativeToken = this.path.at(0);
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
    const path = tokenContract.address === this.path.at(0) ? this.path : [tokenContract.address, ...this.path];

    const [results, liquidityCheckResults] = await Promise.all([
      publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getAmountsIn',
        args: [parseUnits(String(PRICE_BASE_AMOUNT), this.decimals), path],
      }),
      publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getAmountsIn',
        args: [parseUnits(String(PRICE_BASE_AMOUNT * LIQUIDITY_CHECK_RATIO), this.decimals), path],
      }),
    ]);

    if (!hasEnoughLiquidity(results[0], liquidityCheckResults[0])) throw new Error('Not enough liquidity');

    return results[0] / PRICE_BASE_AMOUNT;
  }
}

// The liquidity check is to prevent the price from being too volatile. If there is more than X% slippage,
// we assume that the price is too volatile and we don't use it.
const hasEnoughLiquidity = (normalValue: bigint, checkValue: bigint): boolean => {
  return normalValue * LIQUIDITY_CHECK_RATIO >= fixedPointMultiply(checkValue, 1 - ACCEPTABLE_SLIPPAGE, 18);
};
