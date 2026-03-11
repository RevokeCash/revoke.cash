import { Redis } from '@upstash/redis';
import ky from 'ky';
import { checkActiveSessionEdge, checkRateLimitAllowedEdge, RateLimiters } from 'lib/api/auth';
import { RequestQueue } from 'lib/api/logs/RequestQueue';
import { COINGECKO_API_BASE_URL, COINGECKO_API_KEY } from 'lib/constants';
import { chunkArray, deduplicateArray } from 'lib/utils';
import { type DocumentedChainId, getChainCoingeckoNetworkId, isSupportedChain } from 'lib/utils/chains';
import { MINUTE } from 'lib/utils/time';
import type { NextRequest } from 'next/server';
import { type Address, getAddress } from 'viem';

interface Props {
  params: Promise<Params>;
}

interface Params {
  chainId: string;
}

interface RequestBody {
  addresses: Address[];
}

// interface Response {
//   prices: Record<Address, number | null>;
// }

interface CoinGeckoSimplePriceResponse {
  data: {
    attributes: {
      token_prices: Record<string, string>;
      h24_volume_usd: Record<string, string>;
      total_reserve_in_usd: Record<string, string>;
    };
  };
}

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

const PRICE_CACHE = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : undefined;

// Coingecko has a limit of 500 requests per minute, that we undercut
const PRICE_QUEUE = new RequestQueue('token-prices-onchain', {
  intervalCap: 400,
  interval: 1 * MINUTE,
});

const CACHE_TTL = 1 * 60 * 20; // 20 minutes
const CACHE_MISS_VALUE = -1;
const COINGECKO_MAX_ADDRESSES_PER_REQUEST = 100;
const MIN_TOTAL_RESERVE_USD = 50_000;

export async function POST(req: NextRequest, { params }: Props) {
  const { chainId: chainIdString } = await params;

  if (!(await checkActiveSessionEdge(req))) {
    return new Response(JSON.stringify({ message: 'No API session is active' }), { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PRICE))) {
    return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), { status: 429 });
  }

  const chainId = Number(chainIdString) as DocumentedChainId;
  if (!isSupportedChain(chainId)) {
    return new Response(JSON.stringify({ message: `Chain with ID ${chainId} is unsupported` }), { status: 404 });
  }

  const coingeckoNetworkId = getChainCoingeckoNetworkId(chainId);
  if (!coingeckoNetworkId) {
    return new Response(JSON.stringify({ message: `Chain with ID ${chainId} has no Coingecko network mapping` }), {
      status: 404,
    });
  }

  const body = (await req.json()) as RequestBody;

  const uniqueAddresses = deduplicateArray(body.addresses.map((address) => getAddress(address)));
  const prices = await getTokenPrices(chainId, coingeckoNetworkId, uniqueAddresses);

  return new Response(JSON.stringify({ prices }), { status: 200 });
}

const getTokenPrices = async (
  chainId: number,
  coingeckoNetworkId: string,
  addresses: Address[],
): Promise<Record<Address, number | null>> => {
  if (addresses.length === 0) return {};

  const pricesByAddress = {} as Record<Address, number | null>;
  const uncachedAddresses: Address[] = [];

  const cachedResults = await Promise.all(
    addresses.map(async (address) => ({ address, value: await getCachedPrice(chainId, address) })),
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
    chunks.map((chunk) => fetchPricesFromCoinGecko(coingeckoNetworkId, chunk)),
  );

  for (const response of coingeckoResponses) {
    for (const [address, price] of Object.entries(response)) {
      setCachedPrice(chainId, address as Address, price);
      pricesByAddress[address as Address] = price;
    }
  }

  return pricesByAddress;
};

const fetchPricesFromCoinGecko = async (
  networkId: string,
  addresses: Address[],
): Promise<Record<Address, number | null>> => {
  const headers = { 'x-cg-pro-api-key': COINGECKO_API_KEY };
  const addressList = addresses.join(',');
  const url = `${COINGECKO_API_BASE_URL}/onchain/simple/networks/${networkId}/token_price/${addressList}`;

  try {
    const searchParams = new URLSearchParams({
      include_total_reserve_in_usd: 'true',
    });

    const response = await PRICE_QUEUE.add(() =>
      ky.get(url, { headers, searchParams }).json<CoinGeckoSimplePriceResponse>(),
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
    throw new Error(`Failed to fetch token prices from CoinGecko: ${(error as Error).message}`);
  }
};

const getCachedPrice = async (chainId: number, address: Address): Promise<number | null | undefined> => {
  const cachedPrice = await PRICE_CACHE?.get<number>(getCacheKey(chainId, address));

  if (cachedPrice === CACHE_MISS_VALUE) return null;
  if (typeof cachedPrice === 'number') return cachedPrice;
  return undefined;
};

const setCachedPrice = async (chainId: number, address: Address, price: number | null) => {
  await PRICE_CACHE?.set(getCacheKey(chainId, address), price ?? CACHE_MISS_VALUE, { ex: CACHE_TTL });
};

const getCacheKey = (chainId: number, address: Address): string => {
  return `token-prices-onchain:${chainId}:${address}`;
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
