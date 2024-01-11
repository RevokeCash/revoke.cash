import ky from 'ky';
import { TokenContract } from 'lib/interfaces';
import { AbstractPriceStrategy, AbstractPriceStrategyOptions } from './AbstractPriceStrategy';
import { PriceStrategy } from './PriceStrategy';

interface ResevoirPriceStrategyOptions extends Partial<AbstractPriceStrategyOptions> {}

export class ResevoirPriceStrategy extends AbstractPriceStrategy implements PriceStrategy {
  constructor(options: ResevoirPriceStrategyOptions) {
    super({ nativeAsset: options.nativeAsset, supportedAssets: ['ERC721'] });
  }

  protected async calculateTokenPriceInternal(tokenContract: TokenContract): Promise<number> {
    const result = await ky
      .get(`/api/${1}/floorPrice?contractAddress=${tokenContract.address}`)
      .json<{ floorPrice: number }>();

    return result.floorPrice;
  }
}
