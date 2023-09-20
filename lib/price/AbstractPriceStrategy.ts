import { ERC20_ABI } from 'lib/abis';
import { TokenContract } from 'lib/interfaces';
import { Address, PublicClient } from 'viem';
import { PriceStrategy } from './PriceStrategy';
import { calculateTokenPrice } from './utils';

export interface AbstractPriceStrategyOptions {
  nativeAsset: Address;
}

export abstract class AbstractPriceStrategy implements PriceStrategy {
  nativeAsset: Address;

  constructor(options: AbstractPriceStrategyOptions) {
    this.nativeAsset = options.nativeAsset;
  }

  public async calculateNativeTokenPrice(publicClient: PublicClient): Promise<number> {
    const inversePrice = await this.calculateInversePrice({
      address: this.nativeAsset,
      abi: ERC20_ABI,
      publicClient,
    });

    const price = calculateTokenPrice(inversePrice, 18);

    return price;
  }

  public abstract calculateInversePrice(tokenContract: TokenContract): Promise<bigint>;
}
