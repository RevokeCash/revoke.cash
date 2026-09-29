import {
  getChainCoingeckoAssetPlatformId,
  getChainCoingeckoNetworkId,
  getChainNativeTokenCoingeckoId,
} from '@revoke.cash/core/chains';
import { COINGECKO_API_BASE_URL, COINGECKO_API_KEY } from '@revoke.cash/core/constants';
import ky from '@revoke.cash/core/ky';
import { RequestQueue } from '@revoke.cash/core/request-queue';
import { chunkArray, deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import { ExportableError } from '@revoke.cash/core/utils/errors';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { Redis } from '@upstash/redis';
import { type Address, getAddress, isAddress } from 'viem';

interface CoinGeckoSimplePriceResponse {
  data: {
    attributes: {
      token_prices: Record<string, string>;
      h24_volume_usd: Record<string, string>;
      total_reserve_in_usd: Record<string, string>;
    };
  };
}

interface CoinGeckoMarketChartResponse {
  prices: Array<[timestampMs: number, priceUsd: number]>;
}

interface CoinGeckoNftMarket {
  id: string;
  contract_address: string | null;
  floor_price: { usd: number | null } | null;
}

export class PriceError extends ExportableError {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'PriceError';
  }

  export() {
    return { status: this.status, body: { message: this.message } };
  }
}

const CACHE_TTL_SECONDS = 20 * 60;
const CACHE_MISS_VALUE = -1;
const COINGECKO_MAX_ADDRESSES_PER_REQUEST = 100;
const MIN_TOTAL_RESERVE_USD = 50_000;
const COINGECKO_NFT_MARKETS_PAGE_SIZE = 250;

const PRICE_CACHE = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : undefined;

// Coingecko has a limit of 500 requests per minute, that we undercut
const COINGECKO_PRICE_QUEUE = new RequestQueue('coingecko-prices', {
  intervalCap: 400,
  interval: 1 * MINUTE,
});

export const getNativeTokenPriceUsd = async (chainId: number): Promise<number | null> => {
  const nativeTokenCoingeckoId = getChainNativeTokenCoingeckoId(chainId);
  if (!nativeTokenCoingeckoId) return null;

  const cachedPrice = await PRICE_CACHE?.get<number>(getNativeTokenCacheKey(chainId));
  if (cachedPrice === CACHE_MISS_VALUE) return null;
  if (!isNullish(cachedPrice)) return cachedPrice;

  const result = await COINGECKO_PRICE_QUEUE.add(() =>
    ky
      .get(`${COINGECKO_API_BASE_URL}/simple/price`, {
        headers: getCoinGeckoHeaders(),
        searchParams: {
          vs_currencies: 'usd',
          precision: 'full',
          ids: nativeTokenCoingeckoId,
        },
      })
      .json<{ [key: string]: { usd: number } }>(),
  );
  const price = result?.[nativeTokenCoingeckoId]?.usd ?? CACHE_MISS_VALUE;

  await PRICE_CACHE?.set(getNativeTokenCacheKey(chainId), price, { ex: CACHE_TTL_SECONDS });

  if (price === CACHE_MISS_VALUE) return null;
  return price;
};

// CoinGecko serves hourly prices for a range of a few hours, so the closest price is at most 30 minutes away
const HISTORICAL_PRICE_WINDOW_SECONDS = 2 * 60 * 60;

export const getHistoricalNativeTokenPriceUsd = async (chainId: number, timestamp: Date): Promise<number | null> => {
  const nativeTokenCoingeckoId = getChainNativeTokenCoingeckoId(chainId);
  if (!nativeTokenCoingeckoId) return null;

  const timestampSeconds = Math.floor(timestamp.getTime() / 1000);

  const result = await COINGECKO_PRICE_QUEUE.add(() =>
    ky
      .get(`${COINGECKO_API_BASE_URL}/coins/${nativeTokenCoingeckoId}/market_chart/range`, {
        headers: getCoinGeckoHeaders(),
        searchParams: {
          vs_currency: 'usd',
          from: timestampSeconds - HISTORICAL_PRICE_WINDOW_SECONDS,
          to: timestampSeconds + HISTORICAL_PRICE_WINDOW_SECONDS,
        },
      })
      .json<CoinGeckoMarketChartResponse>(),
  );

  const distanceToTimestamp = ([pointTimestampMs]: [number, number]) =>
    Math.abs(pointTimestampMs - timestamp.getTime());
  const [closestPrice] = [...result.prices].sort((a, b) => distanceToTimestamp(a) - distanceToTimestamp(b));

  return closestPrice?.[1] ?? null;
};

export const getTokenPricesUsd = async (
  chainId: number,
  addresses: Address[],
): Promise<Record<Address, number | null>> => {
  if (addresses.length === 0) return {};

  const coingeckoNetworkId = getChainCoingeckoNetworkId(chainId);
  if (!coingeckoNetworkId) throw new PriceError(404, 'Chain has no CoinGecko network mapping');

  const uniqueAddresses = deduplicateArray(addresses.map((address) => getAddress(address)));
  const pricesByAddress: Record<Address, number | null> = {};
  const uncachedAddresses: Address[] = [];

  const cachedResults = await Promise.all(
    uniqueAddresses.map(async (address) => ({ address, value: await getCachedTokenPrice(chainId, address) })),
  );

  for (const { address, value } of cachedResults) {
    if (value === undefined) {
      uncachedAddresses.push(address);
      continue;
    }

    pricesByAddress[address] = value;
  }

  if (uncachedAddresses.length === 0) {
    return pricesByAddress;
  }

  const chunks = chunkArray(uncachedAddresses, COINGECKO_MAX_ADDRESSES_PER_REQUEST);
  const coingeckoResponses = await Promise.all(
    chunks.map((chunk) => fetchTokenPricesFromCoinGecko(coingeckoNetworkId, chunk)),
  );

  for (const response of coingeckoResponses) {
    for (const [address, price] of Object.entries(response)) {
      pricesByAddress[address as Address] = price;
    }
  }

  await Promise.all(
    Object.entries(pricesByAddress).map(([address, price]) => setCachedTokenPrice(chainId, address as Address, price)),
  );

  return pricesByAddress;
};

const fetchTokenPricesFromCoinGecko = async (
  networkId: string,
  addresses: Address[],
): Promise<Record<Address, number | null>> => {
  const addressList = addresses.join(',');

  try {
    const response = await COINGECKO_PRICE_QUEUE.add(() =>
      ky
        .get(`${COINGECKO_API_BASE_URL}/onchain/simple/networks/${networkId}/token_price/${addressList}`, {
          headers: getCoinGeckoHeaders(),
          searchParams: { include_total_reserve_in_usd: 'true' },
        })
        .json<CoinGeckoSimplePriceResponse>(),
    );

    const attributes = response.data.attributes;
    const pricesFromResponse = attributes.token_prices;
    const reserveByAddress = attributes.total_reserve_in_usd;

    return Object.fromEntries(
      addresses.map((address) => {
        const normalizedAddress = getAddress(address);
        const price = parseNumber(getCoinGeckoValue(pricesFromResponse, normalizedAddress));
        const totalReserveUsd = parseNumber(getCoinGeckoValue(reserveByAddress, normalizedAddress));
        const isReliablePrice = (totalReserveUsd ?? 0) >= MIN_TOTAL_RESERVE_USD;

        return [normalizedAddress, isReliablePrice ? price : null];
      }),
    );
  } catch (error) {
    console.error('Failed to fetch token prices from CoinGecko', error);
    throw new PriceError(503, 'Token prices are temporarily unavailable');
  }
};

const getCachedTokenPrice = async (chainId: number, address: Address): Promise<number | null | undefined> => {
  const cachedPrice = await PRICE_CACHE?.get<number>(getTokenPriceCacheKey(chainId, address));

  if (cachedPrice === CACHE_MISS_VALUE) return null;
  if (typeof cachedPrice === 'number') return cachedPrice;
  return undefined;
};

const setCachedTokenPrice = async (chainId: number, address: Address, price: number | null): Promise<void> => {
  await PRICE_CACHE?.set(getTokenPriceCacheKey(chainId, address), price ?? CACHE_MISS_VALUE, {
    ex: CACHE_TTL_SECONDS,
  });
};

// CoinGecko only tracks a few thousand NFT collections, so we fetch the floor prices of all collections on a chain at
// once, rather than requesting (and mostly missing) each contract separately
export const getNftFloorPricesUsd = async (
  chainId: number,
  addresses: Address[],
): Promise<Record<Address, number | null>> => {
  if (addresses.length === 0) return {};

  const assetPlatformId = getChainCoingeckoAssetPlatformId(chainId);
  if (!assetPlatformId) throw new PriceError(404, 'Chain has no CoinGecko asset platform mapping');

  const floorPrices = await getNftFloorPricesForAssetPlatform(assetPlatformId);

  return Object.fromEntries(
    addresses.map((address) => [getAddress(address), floorPrices[getAddress(address)] ?? null]),
  );
};

const getNftFloorPricesForAssetPlatform = async (assetPlatformId: string): Promise<Record<Address, number>> => {
  const cacheKey = getNftFloorPricesCacheKey(assetPlatformId);
  const cachedFloorPrices = await PRICE_CACHE?.get<Record<Address, number>>(cacheKey);
  if (cachedFloorPrices) return cachedFloorPrices;

  const floorPrices = await fetchNftFloorPricesFromCoinGecko(assetPlatformId);
  await PRICE_CACHE?.set(cacheKey, floorPrices, { ex: CACHE_TTL_SECONDS });

  return floorPrices;
};

const fetchNftFloorPricesFromCoinGecko = async (assetPlatformId: string): Promise<Record<Address, number>> => {
  try {
    const markets = deduplicateArray(await fetchNftMarketsFromCoinGecko(assetPlatformId), (market) => market.id);

    const collections = markets
      .filter((market) => isAddress(market.contract_address ?? '', { strict: false }))
      .map((market) => ({ address: getAddress(market.contract_address!), floorPriceUsd: market.floor_price?.usd }));

    // Some contracts hold multiple collections (e.g. Art Blocks), so a single floor price for the contract would be wrong
    const collectionCountByAddress = collections.reduce(
      (counts, collection) => counts.set(collection.address, (counts.get(collection.address) ?? 0) + 1),
      new Map<Address, number>(),
    );

    return Object.fromEntries(
      collections
        .filter((collection) => collectionCountByAddress.get(collection.address) === 1)
        .flatMap(({ address, floorPriceUsd }) => (isNullish(floorPriceUsd) ? [] : [[address, floorPriceUsd]])),
    );
  } catch (error) {
    console.error('Failed to fetch NFT floor prices from CoinGecko', error);
    throw new PriceError(503, 'NFT floor prices are temporarily unavailable');
  }
};

const fetchNftMarketsFromCoinGecko = async (assetPlatformId: string, page = 1): Promise<CoinGeckoNftMarket[]> => {
  const markets = await COINGECKO_PRICE_QUEUE.add(() =>
    ky
      .get(`${COINGECKO_API_BASE_URL}/nfts/markets`, {
        headers: getCoinGeckoHeaders(),
        searchParams: { asset_platform_id: assetPlatformId, per_page: COINGECKO_NFT_MARKETS_PAGE_SIZE, page },
      })
      .json<CoinGeckoNftMarket[]>(),
  );

  if (markets.length < COINGECKO_NFT_MARKETS_PAGE_SIZE) return markets;
  return [...markets, ...(await fetchNftMarketsFromCoinGecko(assetPlatformId, page + 1))];
};

const getNativeTokenCacheKey = (chainId: number): string => {
  return `token-price-native:${chainId}`;
};

const getTokenPriceCacheKey = (chainId: number, address: Address): string => {
  return `token-prices-onchain:${chainId}:${address}`;
};

const getNftFloorPricesCacheKey = (assetPlatformId: string): string => {
  return `nft-floor-prices:${assetPlatformId}`;
};

const getCoinGeckoHeaders = () => {
  return COINGECKO_API_KEY ? { 'x-cg-pro-api-key': COINGECKO_API_KEY } : undefined;
};

const parseNumber = (value: string | undefined): number | null => {
  if (!value) return null;

  const numericValue = Number(value);
  if (Number.isNaN(numericValue) || !Number.isFinite(numericValue)) return null;
  return numericValue;
};

const getCoinGeckoValue = (values: Record<string, string>, address: Address): string | undefined => {
  return values[address] ?? values[address.toLowerCase()];
};
