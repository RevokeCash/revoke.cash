import { getChainCoingeckoNetworkId } from '@revoke.cash/core/chains';
import { COINGECKO_API_BASE_URL, COINGECKO_API_KEY } from '@revoke.cash/core/constants';
import { RequestQueue } from '@revoke.cash/core/request-queue';
import { addressSchema, supportedChainIdSchema } from '@revoke.cash/core/schemas';
import { chunkArray, deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import { MINUTE } from '@revoke.cash/core/utils/time';
import { Redis } from '@upstash/redis';
import ky from 'ky';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { ApiError, handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { type Address, getAddress } from 'viem';
import { z } from 'zod';

interface Props {
  params: Promise<{ chainId: string }>;
}

const schemas = {
  params: z.object({
    chainId: supportedChainIdSchema.refine((chainId) => !isNullish(getChainCoingeckoNetworkId(chainId)), {
      message: 'Chain has no Coingecko network mapping',
      params: { status: 404 },
    }),
  }),
  body: z.object({ addresses: z.array(addressSchema) }).strict(),
};

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

export async function POST(req: NextRequest, props: Props) {
  try {
    await authorizeRequest(req, {
      auth: 'api-session',
      rateLimiter: RateLimiters.PRICE,
    });
    const { params, body } = await parseRequest(req, props, schemas);

    // Schema refinement ensures this is not null
    const coingeckoNetworkId = getChainCoingeckoNetworkId(params.chainId)!;

    const uniqueAddresses = deduplicateArray(body.addresses);
    const prices = await getTokenPrices(params.chainId, coingeckoNetworkId, uniqueAddresses);

    return NextResponse.json({ prices });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Error fetching token prices' });
  }
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
    console.error('Failed to fetch token prices from CoinGecko', error);
    throw new ApiError(503, 'Token prices are temporarily unavailable');
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
