import ky from 'lib/ky';
import { TokenContract } from 'lib/utils/tokens';
import { AbstractPriceStrategy, AbstractPriceStrategyOptions } from './AbstractPriceStrategy';
import { PriceStrategy } from './PriceStrategy';

interface BackendPriceStrategyOptions extends Partial<AbstractPriceStrategyOptions> { }

export class BackendPriceStrategy extends AbstractPriceStrategy implements PriceStrategy {
  constructor(options: BackendPriceStrategyOptions) {
    super({ nativeAsset: options.nativeAsset, supportedAssets: ['ERC721'] });
  }

  protected async calculateTokenPriceInternal(tokenContract: TokenContract): Promise<number> {
    const result = await ky
      .get(`/api/${tokenContract.publicClient.chain!.id}/floorPrice?contractAddress=${tokenContract.address}`)
      .json<{ floorPrice: number }>();

    return result.floorPrice;
  }
}
