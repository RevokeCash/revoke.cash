import { ERC20_ABI } from 'lib/abis';
import type { TokenContract, TokenStandard } from 'lib/utils/tokens';
import type { Address, PublicClient } from 'viem';
import type { PriceStrategy } from './PriceStrategy';
import { strategySupportsToken } from './utils';

export interface AbstractPriceStrategyOptions {
  nativeAsset?: Address;
  supportedAssets: TokenStandard[];
}

export abstract class AbstractPriceStrategy implements PriceStrategy {
  nativeAsset?: Address;
  supportedAssets: TokenStandard[];

  constructor(options: AbstractPriceStrategyOptions) {
    this.nativeAsset = options.nativeAsset;
    this.supportedAssets = options.supportedAssets;
  }

  public async calculateNativeTokenPrice(publicClient: PublicClient): Promise<number | undefined> {
    if (!this.nativeAsset) {
      throw new Error('Native token type is not supported by this price strategy');
    }

    const tokenPrice = await this.calculateTokenPrice({
      address: this.nativeAsset,
      abi: ERC20_ABI,
      publicClient,
    });

    return tokenPrice;
  }

  public calculateTokenPrice(tokenContract: TokenContract): Promise<number | undefined> {
    if (!strategySupportsToken(this, tokenContract)) {
      throw new Error('Token type is not supported by this price strategy');
    }

    return this.calculateTokenPriceInternal(tokenContract);
  }

  protected abstract calculateTokenPriceInternal(tokenContract: TokenContract): Promise<number | undefined>;
}
