import ky from 'ky';
import { AlchemyNFTSalesGetter } from 'lib/api/nft/AlchemySalesGetter';
import { NFTSalesGetter } from 'lib/api/nft/NFTSalesGetter';
import { TokenContract } from 'lib/interfaces';
import { AbstractPriceStrategy, AbstractPriceStrategyOptions } from './AbstractPriceStrategy';
import { PriceStrategy } from './PriceStrategy';

interface AlchemyPricingStrategyOptions extends Partial<AbstractPriceStrategyOptions> {
  apiKey: string;
}

export class AlchemyPricingStrategy extends AbstractPriceStrategy implements PriceStrategy {
  nftSalesGetter: NFTSalesGetter;

  constructor(options: AlchemyPricingStrategyOptions) {
    super({ nativeAsset: options.nativeAsset, supportedAssets: ['ERC721'] });

    this.nftSalesGetter = new AlchemyNFTSalesGetter(options.apiKey);
  }

  protected async calculateInversePriceInternal(tokenContract: TokenContract): Promise<bigint> {
    const start = Date.now();
    const alchemyNFTSales = await ky
      .get(`/api/${tokenContract.publicClient.chain.id}/floorPrice?contractAddress=${tokenContract.address}`, {
        retry: 3,
      })
      .json<{
        floorPrice: bigint;
        decimals: number;
      }>();

    console.log('duration', Date.now() - start);

    return alchemyNFTSales.floorPrice;
  }
}
