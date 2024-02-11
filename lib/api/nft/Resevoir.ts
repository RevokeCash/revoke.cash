// API call to Resevoir.tools go here

import ky, { SearchParamsOption } from 'ky';
import { isRateLimitError, parseErrorMessage } from 'lib/utils/errors';
import { SECOND } from 'lib/utils/time';
import { NFTGetter } from '.';
import { RequestQueue } from '../logs/RequestQueue';

// Don't return a price if the collection is on the ignore list
const IGNORE_LIST = [
  '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85', // ENS Names
];

export class ResevoirNFT implements NFTGetter {
  private queue: RequestQueue;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.queue = new RequestQueue(`resevoir:${apiKey}`, { interval: 1000, intervalCap: 80 });
  }

  public async getFloorPriceUSD(contractAddress: string): Promise<number> {
    if (IGNORE_LIST.includes(contractAddress)) {
      throw new Error(`Collection ${contractAddress} is on the ignore list`);
    }

    const collection = await this.getCollection(contractAddress);

    const weeklyVolume = collection.volume?.['7day'];
    const floorPriceUSD = collection.floorAsk?.price?.amount?.usd;

    // TODO: Do we want to require a higher weekly volume than just *any*?
    if (!weeklyVolume) {
      throw new Error(`Not enough volume for ${contractAddress}`);
    }

    if (!floorPriceUSD) {
      throw new Error(`No floor price found for ${contractAddress}`);
    }

    return floorPriceUSD;
  }

  // TODO: For collections like Art Blocks, we should identify token ranges
  // (`{artblocksContractAddress}:{startTokenId}:{endTokenId}`) - for now we just pick the cheapest subcollection
  private async getCollection(contractAddress: string): Promise<ResevoirNFTCollection> {
    const url = `https://api.reservoir.tools/collections/v7`;
    const searchParams = {
      contract: contractAddress,
      sortBy: 'floorAskPrice',
      sortDirection: 'asc',
    };

    const result = await this.makeGetRequest<{ collections: ResevoirNFTCollection[] }>(url, searchParams);

    if (result.collections.length === 0) {
      throw new Error(`No collection found for contract address ${contractAddress}`);
    }

    // Fall back to the first collection if no viable subcollection is found
    return pickCheapestSubcollectionWithVolume(result.collections) ?? result.collections[0];
  }

  private async makeGetRequest<T>(url: string, searchParams: SearchParamsOption): Promise<T> {
    const headers = {
      'x-api-key': this.apiKey,
    };

    try {
      const result = await this.queue.add(() =>
        ky.get(url, { headers, searchParams, retry: 3, timeout: 2 * SECOND }).json<any>(),
      );
      return result;
    } catch (e) {
      if (isRateLimitError(parseErrorMessage(e))) {
        console.error('Resevoir: Rate limit reached, retrying...');

        return this.makeGetRequest<T>(url, searchParams);
      }

      throw new Error(e.data?.error_message ?? e.message);
    }
  }
}

const pickCheapestSubcollectionWithVolume = (collections: ResevoirNFTCollection[]): ResevoirNFTCollection => {
  const viableCollections = collections
    .filter((collection) => !!collection.volume['7day'])
    .filter((collection) => !!collection.floorAsk?.price?.amount?.usd)
    .sort((a, b) => a.floorAsk?.price?.amount?.usd - b.floorAsk?.price?.amount?.usd);

  if (collections[0].primaryContract === '0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270') {
    console.log(viableCollections);
  }

  return viableCollections[0];
};

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
  volume?: ResevoirVolume;
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

interface ResevoirVolume {
  '1day': number;
  '7day': number;
  '30day': number;
  alltime: number;
}
