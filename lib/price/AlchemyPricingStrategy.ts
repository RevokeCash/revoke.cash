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
    console.log('calculateInversePriceInternal', tokenContract);

    const alchemyNFTSales = await this.nftSalesGetter.getNFTSales(tokenContract.address, 'desc', 1);
    const mostRecentSale = alchemyNFTSales[0];

    if (!mostRecentSale) {
      throw new Error(`No Alchemy NFT sales found for address: ${tokenContract.address}`);
    }

    return BigInt(mostRecentSale.price);
  }
}
