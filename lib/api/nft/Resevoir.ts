// API call to Resevoir.tools go here

import ky, { SearchParamsOption } from 'ky';
import { isRateLimitError, parseErrorMessage } from 'lib/utils/errors';
import { NFTGetter } from '.';
import { RequestQueue } from '../logs/RequestQueue';

export class ResevoirNFT implements NFTGetter {
  private queue: RequestQueue;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.queue = new RequestQueue(`resevoir:${apiKey}`, { interval: 1000, intervalCap: 40 });
  }

  public async getFloorPriceUSD(contractAddress: string): Promise<number> {
    const collection = await this.getCollection(contractAddress);

    if (!collection.floorAsk?.price?.amount?.usd) {
      throw new Error(`No floor price found for ${contractAddress}`);
    }

    const floorPriceUSD = collection.floorAsk.price.amount.usd;

    return floorPriceUSD;
  }

  private async getCollection(contractAddress: string): Promise<ResevoirNFTCollection> {
    const url = `https://api.reservoir.tools/collections/v7`;
    const searchParams = {
      id: contractAddress,
    };

    const collections = await this.makeGetRequest<{
      collections: ResevoirNFTCollection[];
    }>(url, searchParams);

    if (collections.collections.length === 0) {
      throw new Error(`No collection found for contract address ${contractAddress}`);
    }

    // TODO: Check if using the first collection is correct.
    return collections.collections[0];
  }

  private async makeGetRequest<T>(url: string, searchParams: SearchParamsOption): Promise<T> {
    const headers = {
      'x-api-key': this.apiKey,
    };

    try {
      const result = await this.queue.add(() =>
        ky.get(url, { headers, searchParams, retry: 3, timeout: false }).json<any>(),
      );
      return result;
    } catch (e) {
      if (isRateLimitError(parseErrorMessage(e))) {
        console.error('Rate limit reached, retrying...');

        return this.makeGetRequest<T>(url, searchParams);
      }

      throw new Error(e.data?.error_message ?? e.message);
    }
  }
}

interface ResevoirNFTCollection {
  chainId: number;
  id: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  symbol: string;
  contractDeployedAt: string | null;
  image: string;
  banner: string;
  twitterUrl: string | null;
  discordUrl: string;
  externalUrl: string;
  twitterUsername: string;
  openseaVerificationStatus: string;
  description: string;
  metadataDisabled: boolean;
  isSpam: boolean;
  sampleImages: string[];
  tokenCount: string;
  onSaleCount: string;
  primaryContract: string;
  tokenSetId: string;
  creator: string;
  royalties: ResevoirRoyalties;
  allRoyalties: ResevoirAllRoyalties;
  floorAsk?: ResevoirFloorAsk;
}

interface ResevoirFloorAsk {
  id: string;
  sourceDomain: string;
  price?: {
    currency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    amount?: {
      raw: string;
      decimal: string;
      usd: number;
      native: number;
    };
  };
}

interface ResevoirRoyalties {
  recipient: string;
  breakdown: { bps: number; recipient: string }[];
  bps: number;
}

interface ResevoirAllRoyalties {
  eip2981: ResevoirRoyaltyRecipient[];
  onchain: ResevoirRoyaltyRecipient[];
  opensea: ResevoirRoyaltyRecipient[];
}

interface ResevoirRoyaltyRecipient {
  recipient: string;
  breakdown: { bps: number; recipient: string }[];
  bps: number;
}
