import { getEventGetter } from '@revoke.cash/core/events/getters';
import { addressSchema, backendSupportedChainIdSchema, hexStringSchema } from '@revoke.cash/core/schemas';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { checkActiveSessionEdge, checkRateLimitAllowedEdge, RateLimiters } from 'lib/api/auth';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ chainId: string }>;
}

const schemas = {
  params: z.object({ chainId: backendSupportedChainIdSchema }),
  body: z
    .object({
      address: addressSchema.optional(),
      topics: z.array(hexStringSchema.nullable()),
      fromBlock: z.number().int().nonnegative(),
      toBlock: z.number().int().nonnegative(),
    })
    .strict()
    .refine((filter) => filter.fromBlock <= filter.toBlock, { message: 'fromBlock must be <= toBlock' }),
};

export async function POST(req: NextRequest, props: Props) {
  if (!(await checkActiveSessionEdge(req))) {
    return NextResponse.json({ message: 'No API session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.LOGS))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { data, error } = await parseRequest(req, props, schemas);
  if (error) return error;
  const { params, body: filter } = data;

  try {
    const eventGetter = getEventGetter(params.chainId);
    const events = await eventGetter.getEvents(params.chainId, filter);
    return NextResponse.json(events);
  } catch (e) {
    console.error('Error occurred', parseErrorMessage(e));
    return NextResponse.json({ message: parseErrorMessage(e) }, { status: 500 });
  }
}
