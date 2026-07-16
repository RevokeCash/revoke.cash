import { getDeferredActions, getStuckSubmittedActions } from '@revoke.cash/core/admin/executor';
import { handleAdminRead } from 'lib/api/admin';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const handler = async () => {
    const [stuckSubmitted, deferred] = await Promise.all([getStuckSubmittedActions(), getDeferredActions()]);
    return { stuckSubmitted, deferred };
  };

  return handleAdminRead(req, handler);
}
