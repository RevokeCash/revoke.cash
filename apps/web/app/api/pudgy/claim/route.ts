import { getAllowancesFromEvents } from '@revoke.cash/core/allowances';
import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { getTokenEvents } from '@revoke.cash/core/chains/events';
import { getScriptLogsProvider } from '@revoke.cash/core/events/providers';
import { addressSchema } from '@revoke.cash/core/schemas';
import { isNullish } from '@revoke.cash/core/utils';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { alreadyOwnsSoulboundToken, canMint } from 'app/[locale]/cold-storage-sbt/utils';
import { checkActiveSessionEdge, checkRateLimitAllowedEdge, RateLimiters } from 'lib/api/auth';
import { parseRequest } from 'lib/api/validation';
import ky from 'lib/ky';
import { type NextRequest, NextResponse } from 'next/server';
import type { Hash } from 'viem';
import { z } from 'zod';
import { PUDGY_API_KEY, PUDGY_API_URL } from '../constants';

export const runtime = 'edge';
interface PudgyApiResponse {
  success: boolean;
  taskId: Hash;
}

const schemas = {
  params: z.undefined(),
  body: z.object({ address: addressSchema }).strict(),
};

export async function POST(req: NextRequest) {
  if (!(await checkActiveSessionEdge(req))) {
    return NextResponse.json({ message: 'No API session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PUDGY))) {
    return NextResponse.json({ message: 'Rate limit exceeded' }, { status: 429 });
  }

  if (!PUDGY_API_KEY || !PUDGY_API_URL) {
    return NextResponse.json({ message: 'PUDGY_API_KEY or PUDGY_API_URL is not set' }, { status: 500 });
  }

  const { data, error } = await parseRequest(req, undefined, schemas);
  if (error) return error;

  // We only check Ethereum for now
  const chainId = 1;
  const { address } = data.body;

  // Get the events and allowances for the user
  const publicClient = createViemPublicClientForChain(chainId);
  const logsProvider = getScriptLogsProvider(chainId);
  const { events } = await getTokenEvents(chainId, address, logsProvider);
  const allowances = await getAllowancesFromEvents(address, events, publicClient, chainId);

  if (await alreadyOwnsSoulboundToken(address)) {
    return NextResponse.json({ status: 'already_claimed', message: 'User already owns the SBT' }, { status: 400 });
  }

  // Check if the user owns any of the tokens that enable them to mint
  if (!(await canMint(address))) {
    return NextResponse.json(
      { status: 'no_tokens', message: 'User does not own any Pudgy-related tokens' },
      { status: 400 },
    );
  }

  // Check if the user has active allowances that can be revoked
  const activeAllowances = allowances
    .filter((allowance) => Boolean(allowance.payload))
    .filter((allowance) => isNullish(allowance.payload?.revokeError));
  if (activeAllowances.length > 0) {
    return NextResponse.json({ status: 'has_allowances', message: 'User has active allowances' }, { status: 400 });
  }

  let response: PudgyApiResponse;

  try {
    response = await ky
      .post(PUDGY_API_URL, { json: { receiver: address }, headers: { 'x-api-key': PUDGY_API_KEY } })
      .json<PudgyApiResponse>();

    if (!response.success) {
      return NextResponse.json({ status: 'failed', message: 'Pudgy Penguins API error', ...response }, { status: 500 });
    }
  } catch (error) {
    console.error('Pudgy Penguins API error:', error);
    return NextResponse.json(
      { status: 'failed', message: `Pudgy Penguins API error: ${parseErrorMessage(error)}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ status: 'confirmed', taskId: response.taskId });
}
