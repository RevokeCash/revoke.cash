import { alreadyOwnsSoulboundToken, canMint } from 'app/[locale]/cold-storage-sbt/utils';
import { checkActiveSessionEdge, checkRateLimitAllowedEdge, RateLimiters } from 'lib/api/auth';
import { getTokenEvents } from 'lib/chains/events';
import ky from 'lib/ky';
import { getAllowancesFromEvents } from 'lib/utils/allowances';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import { parseErrorMessage } from 'lib/utils/errors';
import type { NextRequest } from 'next/server';
import type { Hash } from 'viem';
import { CACHE_KEY_PREFIX, CACHE_TTL, PUDDY_CACHE, PUDGY_API_KEY, PUDGY_API_URL } from '../constants';

export const runtime = 'edge';
interface PudgyApiResponse {
  success: boolean;
  taskId: Hash;
}

export async function POST(req: NextRequest) {
  if (!(await checkActiveSessionEdge(req))) {
    return new Response(JSON.stringify({ message: 'No API session is active' }), { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PUDGY))) {
    return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), { status: 429 });
  }

  if (!PUDGY_API_KEY || !PUDGY_API_URL) {
    return new Response(JSON.stringify({ message: 'PUDGY_API_KEY or PUDGY_API_URL is not set' }), { status: 500 });
  }

  // We only check Ethereum for now
  const chainId = 1;
  const { address } = await req.json();

  const cachedStatus = await PUDDY_CACHE?.get(`${CACHE_KEY_PREFIX}:${address}`);
  if (cachedStatus) {
    return new Response(JSON.stringify(cachedStatus), { status: 200 });
  }

  // Get the events and allowances for the user
  const publicClient = createViemPublicClientForChain(chainId);
  const events = await getTokenEvents(chainId, address);
  const allowances = await getAllowancesFromEvents(address, events, publicClient, chainId);

  if (await alreadyOwnsSoulboundToken(address)) {
    return new Response(JSON.stringify({ status: 'already_claimed', message: 'User already owns the SBT' }), {
      status: 400,
    });
  }

  // Check if the user owns any of the tokens that enable them to mint
  if (!(await canMint(address))) {
    return new Response(
      JSON.stringify({ status: 'no_tokens', message: 'User does not own any Pudgy-related tokens' }),
      { status: 400 },
    );
  }

  // Check if the user has active allowances
  const activeAllowances = allowances.filter((allowance) => Boolean(allowance.payload));
  if (activeAllowances.length > 0) {
    return new Response(JSON.stringify({ status: 'has_allowances', message: 'User has active allowances' }), {
      status: 400,
    });
  }

  let response: PudgyApiResponse;

  try {
    response = await ky
      .post(PUDGY_API_URL, { json: { receiver: address }, headers: { 'x-api-key': PUDGY_API_KEY } })
      .json<PudgyApiResponse>();

    if (!response.success) {
      return new Response(JSON.stringify({ status: 'failed', message: 'Pudgy Penguins API error', ...response }), {
        status: 500,
      });
    }
  } catch (error) {
    console.error('Pudgy Penguins API error:', error);
    return new Response(
      JSON.stringify({ status: 'failed', message: `Pudgy Penguins API error: ${parseErrorMessage(error)}` }),
      {
        status: 500,
      },
    );
  }

  // We set the user status to already_claimed so that they can't claim again
  await PUDDY_CACHE?.set(
    `${CACHE_KEY_PREFIX}:${address}`,
    { status: 'already_claimed', taskId: response.taskId },
    { ex: CACHE_TTL },
  );

  return new Response(JSON.stringify({ status: 'confirmed', taskId: response.taskId }), { status: 200 });
}
