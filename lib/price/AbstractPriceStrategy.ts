import { ERC20_ABI } from 'lib/abis';
import { TokenContract, TokenStandard } from 'lib/interfaces';
import { Address, PublicClient } from 'viem';
import { PriceStrategy } from './PriceStrategy';
import { calculateTokenPrice, strategySupportsToken } from './utils';

export interface AbstractPriceStrategyOptions {
  nativeAsset: Address;
  supportedAssets: TokenStandard[];
}

export abstract class AbstractPriceStrategy implements PriceStrategy {
  nativeAsset: Address;
  supportedAssets: TokenStandard[];

  constructor(options: AbstractPriceStrategyOptions) {
    this.nativeAsset = options.nativeAsset;
    this.supportedAssets = options.supportedAssets;
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

  public calculateInversePrice(tokenContract: TokenContract): Promise<bigint> {
    if (!strategySupportsToken(this, tokenContract)) {
      throw new Error('Token type is not supported by this price strategy');
    }

    return this.calculateInversePriceInternal(tokenContract);
  }

  protected abstract calculateInversePriceInternal(tokenContract: TokenContract): Promise<bigint>;
}
