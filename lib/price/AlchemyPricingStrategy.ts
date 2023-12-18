import { ALCHEMY_API_KEY } from 'lib/constants';
import { TokenContract } from 'lib/interfaces';
import { AbstractPriceStrategy, AbstractPriceStrategyOptions } from './AbstractPriceStrategy';
import { PriceStrategy } from './PriceStrategy';

interface AlchemyPricingStrategyOptions extends Partial<AbstractPriceStrategyOptions> {
  tokenId: number;
}

export class AlchemyPricingStrategy extends AbstractPriceStrategy implements PriceStrategy {
  tokenId: number;
  constructor(options: AlchemyPricingStrategyOptions) {
    super({ nativeAsset: options.nativeAsset, supportedAssets: ['ERC721'] });
  }

  protected async calculateInversePriceInternal(tokenContract: TokenContract): Promise<bigint> {
    if (!this.tokenId) throw new Error('Token ID not provided');
    // throw new Error('Method not implemented.');

    console.log('calculateInversePriceInternal', tokenContract);

    const sales = await getNFTSalesFromAlchemy(tokenContract.address, 303000261, 'desc');

    const lastSale = sales.nftSales[0];

    const price = getSalePrice(lastSale);

    console.log('price', price);

    return 1n;
  }
}

const getNFTSalePrice = async (contractAddress: string, tokenId: number): Promise<bigint> => {
  const sales = await getNFTSalesFromAlchemy(contractAddress, tokenId, 'desc');
  const mostRecentSale = sales.nftSales[0];

  const price = getSalePrice(mostRecentSale);

  return price;
};

const getNFTSalesFromAlchemy = async (
  contractAddress: string,
  tokenId: number,
  order: 'asc' | 'desc' = 'asc',
): Promise<nftsal> => {
  const options = { method: 'GET', headers: { accept: 'application/json' } };

  const response = await fetch(
    `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTSales?fromBlock=0&toBlock=latest&order=${order}&contractAddress=${contractAddress}&tokenId=${tokenId}`,
    options,
  );
  const json: AlchemyNFTSaleResponse = await response.json();

  return json;
};

const getSalePrice = (sale: AlchemyNFTSale) => {
  const { sellerFee, protocolFee, royaltyFee } = sale;

  const sellerFeeAmount = BigInt(sellerFee.amount);
  const protocolFeeAmount = BigInt(protocolFee.amount);
  const royaltyFeeAmount = BigInt(royaltyFee.amount);

  const sellerFeeTotal = sellerFeeAmount * BigInt(sellerFee.decimals);
  const protocolFeeTotal = protocolFeeAmount * BigInt(protocolFee.decimals);
  const royaltyFeeTotal = royaltyFeeAmount * BigInt(royaltyFee.decimals);

  const totalFee = sellerFeeTotal + protocolFeeTotal + royaltyFeeTotal;

  const price = BigInt(sale.sellerFee.decimals) - totalFee;

  return price;
};

type AlchemyNFTSaleResponse = {
  nftSales: AlchemyNFTSale[];
};

type AlchemyNFTSale = {
  marketplace: string;
  marketplaceAddress: string;
  contractAddress: string;
  tokenId: string;
  quantity: string;
  buyerAddress: string;
  sellerAddress: string;
  taker: string;
  sellerFee: {
    amount: string;
    tokenAddress: string;
    symbol: string;
    decimals: number;
  };
  protocolFee: {
    amount: string;
    tokenAddress: string;
    symbol: string;
    decimals: number;
  };
  royaltyFee: {
    amount: string;
    tokenAddress: string;
    symbol: string;
    decimals: number;
  };
  blockNumber: number;
  logIndex: number;
  bundleIndex: number;
  transactionHash: string;
};
