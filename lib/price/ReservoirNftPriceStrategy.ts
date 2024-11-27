import { type SearchParamsOption, TimeoutError } from 'ky';
import type { Erc721TokenContract } from 'lib/interfaces';
import ky from 'lib/ky';
import { isRateLimitError } from 'lib/utils/errors';
import { SECOND } from 'lib/utils/time';
import { RequestQueue } from '../api/logs/RequestQueue';
import { AbstractPriceStrategy } from './AbstractPriceStrategy';
import type { PriceStrategy } from './PriceStrategy';

// Don't return a price if the collection is on the ignore list
const IGNORE_LIST = [
  '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85', // ENS Names
  '0xa9a6A3626993D487d2Dbda3173cf58cA1a9D9e9f', // Unstoppable Domains
  '0x22C1f6050E56d2876009903609a2cC3fEf83B415', // POAP
];

interface ReservoirNftPriceStrategyOptions {
  apiKey: string;
  apiUrl: string;
}

const TIMEOUT = 3 * SECOND;

export class ReservoirNftPriceStrategy extends AbstractPriceStrategy implements PriceStrategy {
  private queue: RequestQueue;
  private apiKey: string;
  private apiUrl: string;

  constructor(options: ReservoirNftPriceStrategyOptions) {
    super({ supportedAssets: ['ERC721'] });
    this.apiKey = options.apiKey;
    this.apiUrl = options.apiUrl;
    this.queue = new RequestQueue(`reservoir:${options.apiKey}`, { interval: 1000, intervalCap: 80 });
  }

  public async calculateTokenPriceInternal(contract: Erc721TokenContract): Promise<number> {
    if (IGNORE_LIST.includes(contract.address)) {
      throw new Error(`Collection ${contract.address} is on the ignore list`);
    }

    const collection = await this.getCollection(contract.address);

    const weeklyVolume = collection.volume?.['7day'];
    const floorPriceUSD = collection.floorAsk?.price?.amount?.usd;

    // TODO: Do we want to require a higher weekly volume than just *any*?
    if (!weeklyVolume) {
      throw new Error(`Not enough volume for ${contract.address}`);
    }

    if (!floorPriceUSD) {
      throw new Error(`No floor price found for ${contract.address}`);
    }

    return floorPriceUSD;
  }

  // TODO: For collections like Art Blocks, we should identify token ranges
  // (`{artblocksContractAddress}:{startTokenId}:{endTokenId}`) - for now we just pick the cheapest subcollection
  private async getCollection(contractAddress: string): Promise<ReservoirNFTCollection> {
    const url = `${this.apiUrl}/collections/v7`;
    const searchParams = {
      contract: contractAddress,
      sortBy: 'floorAskPrice',
      sortDirection: 'asc',
    };

    const result = await this.makeGetRequest<{ collections: ReservoirNFTCollection[] }>(url, searchParams);

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
        // Somehow the Ky timeout isn't working, so we have to do it manually (🤷‍♂️)
        Promise.race([
          ky
            .get(url, {
              headers,
              searchParams,
              retry: 0,
            })
            .json<any>(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Manual timeout')), TIMEOUT)),
        ]),
      );
      return result;
    } catch (e) {
      // See (https://github.com/sindresorhus/ky#readme) and search for TimoutError
      if (e instanceof TimeoutError || e.message === 'Manual timeout') {
        console.error('Reservoir: Request timed out, will not retry');

        throw new Error(`Request timed out for ${e.request.url} with search params ${JSON.stringify(searchParams)}`);
      }

      if (isRateLimitError(e)) {
        console.error('Reservoir: Rate limit reached, retrying...');

        return this.makeGetRequest<T>(url, searchParams);
      }

      throw new Error(e.data?.error_message ?? e.message);
    }
  }
}

// TODO: Should we perform this volume check here? Or take the volume across subcollections?
const pickCheapestSubcollectionWithVolume = (collections: ReservoirNFTCollection[]): ReservoirNFTCollection => {
  const viableCollections = collections
    .filter((collection) => !!collection.volume['7day'])
    .filter((collection) => !!collection.floorAsk?.price?.amount?.usd)
    .sort((a, b) => a.floorAsk?.price?.amount?.usd - b.floorAsk?.price?.amount?.usd);

  return viableCollections[0];
};

interface ReservoirNFTCollection {
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
  royalties: ReservoirRoyalties;
  allRoyalties: ReservoirAllRoyalties;
  floorAsk?: ReservoirFloorAsk;
  volume?: ReservoirVolume;
}

interface ReservoirFloorAsk {
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

interface ReservoirRoyalties {
  recipient: string;
  breakdown: { bps: number; recipient: string }[];
  bps: number;
}

interface ReservoirAllRoyalties {
  eip2981: ReservoirRoyaltyRecipient[];
  onchain: ReservoirRoyaltyRecipient[];
  opensea: ReservoirRoyaltyRecipient[];
}

interface ReservoirRoyaltyRecipient {
  recipient: string;
  breakdown: { bps: number; recipient: string }[];
  bps: number;
}

interface ReservoirVolume {
  '1day': number;
  '7day': number;
  '30day': number;
  alltime: number;
}
