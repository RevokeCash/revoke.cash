import { getExecutorPipelines } from '@revoke.cash/core/admin/executor';
import { MAX_PENDING_ACTIONS_PER_CHAIN } from '@revoke.cash/core/auto-revoke/config';
import { handleAdminRead } from 'lib/api/admin';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const handler = async () => {
    const pipelines = await getExecutorPipelines();
    return { pipelines, maxPendingPerChain: MAX_PENDING_ACTIONS_PER_CHAIN };
  };

  return handleAdminRead(req, handler);
}
