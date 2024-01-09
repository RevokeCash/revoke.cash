import { ERC20_ABI } from 'lib/abis';
import { TokenContract, TokenStandard } from 'lib/interfaces';
import { Address, PublicClient } from 'viem';
import { PriceStrategy } from './PriceStrategy';
import { strategySupportsToken } from './utils';

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
    const tokenPrice = await this.calculateTokenPrice({
      address: this.nativeAsset,
      abi: ERC20_ABI,
      publicClient,
    });

    return tokenPrice;
  }

  public calculateTokenPrice(tokenContract: TokenContract): Promise<number> {
    if (!strategySupportsToken(this, tokenContract)) {
      throw new Error('Token type is not supported by this price strategy');
    }

    return this.calculateTokenPriceInternal(tokenContract);
  }

  protected abstract calculateTokenPriceInternal(tokenContract: TokenContract): Promise<number>;
}
