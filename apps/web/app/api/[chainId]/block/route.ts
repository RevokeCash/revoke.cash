import { getScriptLogsProvider } from '@revoke.cash/core/events/providers';
import { supportedChainIdSchema } from '@revoke.cash/core/schemas';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { checkActiveSessionEdge, checkRateLimitAllowedEdge, RateLimiters } from 'lib/api/auth';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ chainId: string }>;
}

const schemas = {
  params: z.object({ chainId: supportedChainIdSchema }),
  body: z.undefined(),
};

export async function GET(req: NextRequest, props: Props) {
  if (!(await checkActiveSessionEdge(req))) {
    return NextResponse.json({ message: 'No API session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.LOGS))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  const { data, error } = await parseRequest(req, props, schemas);
  if (error) return error;
  const { params } = data;

  try {
    const scriptLogsProvider = getScriptLogsProvider(params.chainId);
    const blockNumber = await scriptLogsProvider.getLatestBlock();
    return NextResponse.json({ blockNumber });
  } catch (e) {
    console.error('Error occurred', parseErrorMessage(e));
    return NextResponse.json({ message: parseErrorMessage(e) }, { status: 500 });
  }
}
