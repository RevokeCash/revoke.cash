import type { TokenContract } from 'lib/interfaces';
import ky from 'lib/ky';
import { AbstractPriceStrategy, type AbstractPriceStrategyOptions } from './AbstractPriceStrategy';
import type { PriceStrategy } from './PriceStrategy';

interface BackendPriceStrategyOptions extends Partial<AbstractPriceStrategyOptions> {}

export class BackendPriceStrategy extends AbstractPriceStrategy implements PriceStrategy {
  constructor(options: BackendPriceStrategyOptions) {
    super({ nativeAsset: options.nativeAsset, supportedAssets: ['ERC721'] });
  }

  protected async calculateTokenPriceInternal(tokenContract: TokenContract): Promise<number> {
    const result = await ky
      .get(`/api/${tokenContract.publicClient.chain.id}/floorPrice?contractAddress=${tokenContract.address}`)
      .json<{ floorPrice: number }>();

    return result.floorPrice;
  }
}
