import ky from 'ky';
import { isRateLimitError, parseErrorMessage } from 'lib/utils/errors';
import { RequestQueue } from '../logs/RequestQueue';
import { NFTSale, NFTSalesGetter } from './NFTSalesGetter';

/*
Alchemy Pricing Plans are as follows:
- Free: 300.000.000 CU per month ($0/month)
- Growth: 400.000.000 CU per month ($49/month)
- Scale: 1.500.000.000 CU per month ($199/month)

Cost per endpoint: https://docs.alchemy.com/reference/compute-unit-costs
*/

const ALCHEMY_CU_PER_MONTH = 1_500_000_000;
const ALCHEMY_CU_PER_MINUTE = ALCHEMY_CU_PER_MONTH / (30 * 24 * 60);
const ALCHEMY_NFTSALES_COST = 600;

export class AlchemyNFTSalesGetter implements NFTSalesGetter {
  private queue: RequestQueue;
  constructor(private apiKey: string) {
    const requestsPerMinute = Math.floor(ALCHEMY_CU_PER_MINUTE / ALCHEMY_NFTSALES_COST);
    console.log('Request per minute', requestsPerMinute);

    this.queue = new RequestQueue(`alchemy:${apiKey}`, { interval: 60 * 1_000, intervalCap: requestsPerMinute });
  }

  async getNFTSales(
    chainId: number,
    contractAddress: string,
    order: 'asc' | 'desc',
    limit: number,
  ): Promise<NFTSale[]> {
    const apiUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/${this.apiKey}/getNFTSales`;

    const searchParams = {
      fromBlock: 0,
      toBlock: 'latest',
      order: order,
      contractAddress: contractAddress,
      limit: limit,
    };

    try {
      const result = await this.queue.add(() =>
        ky.get(apiUrl, { searchParams, retry: 3, timeout: false }).json<AlchemyNFTSaleResponse>(),
      );
      return result?.nftSales.map(formatAlchemyNFTSale) ?? [];
    } catch (e) {
      if (isRateLimitError(parseErrorMessage(e))) {
        console.error('Rate limit reached, retrying...');
        // return this.getNFTSales(contractAddress, order, limit);
      }

      throw new Error(e.data?.message ?? e.message);
    }
  }

  async getNFTFloorPrice(chainId: number, contractAddress: string): Promise<bigint> {
    if (chainId !== 1) {
      throw new Error('Only Ethereum mainnet is supported');
    }

    const apiUrl = `https://eth-mainnet.g.alchemy.com/nft/v3/${this.apiKey}/getFloorPrice`;

    const searchParams = {
      contractAddress: contractAddress,
    };

    try {
      const result = await this.queue.add(() =>
        ky.get(apiUrl, { searchParams, retry: 3, timeout: false }).json<AlchemyNFTFloorPriceResponse>(),
      );

      const averageFloorPrice = calculateAverageFloorPrice(result);

      return BigInt(averageFloorPrice);
    } catch (e) {
      if (isRateLimitError(parseErrorMessage(e))) {
        console.error('Rate limit reached, retrying...');
        // return this.getNFTFloorPrice(contractAddress);
      }

      throw new Error(e.data?.message ?? e.message);
    }
  }
}

const calculateAverageFloorPrice = (floorPrice: AlchemyNFTFloorPriceResponse) => {
  const floorPrices = Object.values(floorPrice).map((fp) => fp.floorPrice);
  return Math.min(...floorPrices);
};

const formatAlchemyNFTSale = (sale: AlchemyNFTSale): NFTSale => {
  return {
    marketplace: sale.marketplace,
    marketplaceAddress: sale.marketplaceAddress,
    contractAddress: sale.contractAddress,
    tokenId: sale.tokenId,
    quantity: sale.quantity,
    buyerAddress: sale.buyerAddress,
    sellerAddress: sale.sellerAddress,
    taker: sale.taker,
    sellerFee: sale.sellerFee,
    protocolFee: sale.protocolFee,
    royaltyFee: sale.royaltyFee,
    blockNumber: sale.blockNumber,
    logIndex: sale.logIndex,
    bundleIndex: sale.bundleIndex,
    transactionHash: sale.transactionHash,
    price: getSalePrice(sale),
  };
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

type MarketPlace = string;

type AlchemyNFTFloorPriceResponse = Record<MarketPlace, AlchemyNFTFloorPrice>;

type AlchemyNFTFloorPrice = {
  floorPrice: number;
  priceCurrency: string;
  collectionUrl: string;
  retreivedAt: string;
  error: string | null;
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
