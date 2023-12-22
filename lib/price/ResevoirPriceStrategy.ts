import ky from 'ky';
import { TokenContract } from 'lib/interfaces';
import { AbstractPriceStrategy, AbstractPriceStrategyOptions } from './AbstractPriceStrategy';
import { PriceStrategy } from './PriceStrategy';

interface ResevoirPriceStrategyOptions extends Partial<AbstractPriceStrategyOptions> {}

export class ResevoirPriceStrategy extends AbstractPriceStrategy implements PriceStrategy {
  constructor(options: ResevoirPriceStrategyOptions) {
    super({ nativeAsset: options.nativeAsset, supportedAssets: ['ERC721'] });
  }

  protected async calculateInversePriceInternal(tokenContract: TokenContract): Promise<bigint> {
    const result = await ky
      .get(`/api/${1}/floorPrice?contractAddress=${tokenContract.address}`)
      .json<{ floorPrice: number }>();

    const floorPriceBigInt = BigInt(result.floorPrice * 10 ** 18);

    return floorPriceBigInt;
  }
}
