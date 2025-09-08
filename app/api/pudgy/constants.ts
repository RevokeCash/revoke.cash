import { Redis } from '@upstash/redis';

export const PUDDY_CACHE = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : undefined;

export const CACHE_TTL = 30 * 24 * 60 * 60; // 30 days
export const CACHE_KEY_PREFIX = 'pudgy-checker-staging';

export const PUDGY_API_KEY = process.env.PUDGY_API_KEY;
export const PUDGY_API_URL = process.env.PUDGY_API_URL;
