import { UNISWAP_V3_QUOTER_ABI } from 'lib/abis';
import type { Erc20TokenContract } from 'lib/interfaces';
import { type Address, concat, parseUnits } from 'viem';
import { AbstractPriceStrategy, type AbstractPriceStrategyOptions } from './AbstractPriceStrategy';
import type { PriceStrategy } from './PriceStrategy';
import { calculateTokenPrice } from './utils';

export interface UniswapV3PriceStrategyOptions extends Partial<AbstractPriceStrategyOptions> {
  address: Address;
  path: Address[];
  decimals?: number;
}

const PRICE_BASE_AMOUNT = 1000n;
const LIQUIDITY_CHECK_RATIO = 10n;
const ACCEPTABLE_SLIPPAGE = 0.4;

export class UniswapV3PriceStrategy extends AbstractPriceStrategy implements PriceStrategy {
  abi = UNISWAP_V3_QUOTER_ABI;
  address: Address;
  path: Address[];
  decimals: number;

  constructor(options: UniswapV3PriceStrategyOptions) {
    // Note: the first address (so second entry) in the path is assumed to be the wrapped native token
    super({ nativeAsset: options.nativeAsset ?? options.path[1], supportedAssets: ['ERC20'] });

    this.address = options.address;
    this.path = options.path;
    this.decimals = options.decimals ?? 18;
  }

  protected async calculateTokenPriceInternal(tokenContract: Erc20TokenContract): Promise<number> {
    if (tokenContract.address === this.path.at(-1)) {
      // return parseUnits(String(1), this.decimals);

      return 1;
    }

    const { publicClient } = tokenContract;
    const path = tokenContract.address === this.path.at(1) ? this.path.slice(1) : [tokenContract.address, ...this.path];

    const simulated = await publicClient.simulateContract({
      address: this.address,
      abi: this.abi,
      functionName: 'quoteExactOutput',
      args: [concat(path.reverse()), parseUnits(String(PRICE_BASE_AMOUNT), this.decimals)],
    });

    const [amountIn, sqrtPriceX96AfterList] = simulated.result;

    if (!this.hasEnoughLiquidity(sqrtPriceX96AfterList)) throw new Error('Not enough liquidity');

    // return amountIn / 1000n;

    return calculateTokenPrice(amountIn, this.decimals);
  }

  // TODO: Figure out how to interpret the sqrtPriceX96AfterList
  private hasEnoughLiquidity(sqrtPriceX96AfterList: readonly bigint[]): boolean {
    return true;
  }
}
