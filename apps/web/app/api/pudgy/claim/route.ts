import { getAllowancesFromEvents, simulateRevokeAllowance } from '@revoke.cash/core/allowances';
import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { getTokenEvents } from '@revoke.cash/core/chains/events';
import { getScriptLogsProvider } from '@revoke.cash/core/events/providers';
import { addressSchema } from '@revoke.cash/core/schemas';
import { isNullish } from '@revoke.cash/core/utils';
import { ApiError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { alreadyOwnsSoulboundToken, canMint } from 'app/[locale]/cold-storage-sbt/utils';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
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
  try {
    await authorizeRequest(req, {
      auth: 'api-session',
      rateLimiter: RateLimiters.PUDGY,
    });

    if (!PUDGY_API_KEY || !PUDGY_API_URL) {
      throw new ApiError(500, 'PUDGY_API_KEY or PUDGY_API_URL is not set');
    }

    const { body } = await parseRequest(req, undefined, schemas);

    // We only check Ethereum for now
    const chainId = 1;
    const { address } = body;

    // Get the events and allowances for the user
    const publicClient = createViemPublicClientForChain(chainId);
    const logsProvider = getScriptLogsProvider(chainId);
    const { events } = await getTokenEvents(chainId, address, logsProvider);
    const allowances = await getAllowancesFromEvents(address, events, publicClient, chainId);
    const revokableAllowances = await Promise.all(
      allowances.map((allowance) => simulateRevokeAllowance(allowance, publicClient)),
    );

    if (await alreadyOwnsSoulboundToken(address)) {
      throw new ApiError(400, 'User already owns the SBT', {
        status: 'already_claimed',
        message: 'User already owns the SBT',
      });
    }

    // Check if the user owns any of the tokens that enable them to mint
    if (!(await canMint(address))) {
      throw new ApiError(400, 'User does not own any Pudgy-related tokens', {
        status: 'no_tokens',
        message: 'User does not own any Pudgy-related tokens',
      });
    }

    // Check if the user has active allowances that can be revoked
    const activeAllowances = revokableAllowances.filter((allowance) => isNullish(allowance.payload.revokeError));
    if (activeAllowances.length > 0) {
      throw new ApiError(400, 'User has active allowances', {
        status: 'has_allowances',
        message: 'User has active allowances',
      });
    }

    let response: PudgyApiResponse;

    try {
      response = await ky
        .post(PUDGY_API_URL, { json: { receiver: address }, headers: { 'x-api-key': PUDGY_API_KEY } })
        .json<PudgyApiResponse>();
    } catch (error) {
      console.error('Pudgy Penguins API error:', error);
      const message = `Pudgy Penguins API error: ${parseErrorMessage(error)}`;
      throw new ApiError(500, message, { status: 'failed', message });
    }

    if (!response.success) {
      throw new ApiError(500, 'Pudgy Penguins API error', {
        status: 'failed',
        message: 'Pudgy Penguins API error',
        ...response,
      });
    }

    return NextResponse.json({ status: 'confirmed', taskId: response.taskId });
  } catch (error) {
    return handleApiRouteError(error);
  }
}
