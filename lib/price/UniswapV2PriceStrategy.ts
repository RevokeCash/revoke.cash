import { UNISWAP_V2_ROUTER_ABI } from 'lib/abis';
import { TokenContract } from 'lib/interfaces';
import { fixedPointMultiply } from 'lib/utils/math';
import { Address, parseUnits } from 'viem';
import { AbstractPriceStrategy, AbstractPriceStrategyOptions } from './AbstractPriceStrategy';
import { PriceStrategy } from './PriceStrategy';

export interface UniswapV2PriceStrategyOptions extends Partial<AbstractPriceStrategyOptions> {
  address: Address;
  path: Address[];
  decimals?: number;
  liquidityParameters?: LiquidityParameters;
  feeParameters?: FeeParameters;
}

export interface LiquidityParameters {
  baseAmount?: bigint;
  checkRatio?: bigint;
  acceptableSlippage?: number;
}

export interface FeeParameters {
  fee?: bigint;
}

export class UniswapV2PriceStrategy extends AbstractPriceStrategy implements PriceStrategy {
  abi = UNISWAP_V2_ROUTER_ABI;
  address: Address;
  path: Address[];
  decimals: number;

  baseAmount: bigint;
  checkRatio: bigint;
  acceptableSlippage: number;

  // Certain Uniswap v2 forks (notably Solarbeam on Moonriver) have a different signature for getAmountsIn
  fee: bigint | [];

  // Note: the first address in the path is assumed to be the wrapped native token
  constructor(options: UniswapV2PriceStrategyOptions) {
    super({ nativeAsset: options.nativeAsset ?? options.path[0] });

    this.address = options.address;
    this.path = options.path;
    this.decimals = options.decimals ?? 18;
    this.baseAmount = options.liquidityParameters?.baseAmount ?? 1000n;
    this.checkRatio = options.liquidityParameters?.checkRatio ?? 10n;
    this.acceptableSlippage = options.liquidityParameters?.acceptableSlippage ?? 0.4;
    this.fee = options.feeParameters?.fee ?? [];
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
        args: [parseUnits(String(this.baseAmount), this.decimals), path].concat(this.fee) as any,
      }),
      publicClient.readContract({
        address: this.address,
        abi: this.abi,
        functionName: 'getAmountsIn',
        args: [parseUnits(String(this.checkRatio * this.baseAmount), this.decimals), path].concat(this.fee) as any,
      }),
    ]);

    if (!this.hasEnoughLiquidity(results[0], liquidityCheckResults[0])) throw new Error('Not enough liquidity');

    return results[0] / this.baseAmount;
  }

  // The liquidity check is to prevent the price from being too volatile. If there is more than X% slippage,
  // we assume that the price is too volatile and we don't use it.
  private hasEnoughLiquidity(normalValue: bigint, checkValue: bigint): boolean {
    return normalValue * this.checkRatio >= fixedPointMultiply(checkValue, 1 - this.acceptableSlippage, 18);
  }
}
