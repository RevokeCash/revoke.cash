import { getDeferredActions, getNotUpgradedWallets, getStuckSubmittedActions } from '@revoke.cash/core/admin/executor';
import { handleAdminRead } from 'lib/api/admin';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const handler = async () => {
    const [stuckSubmitted, deferred, notUpgradedWallets] = await Promise.all([
      getStuckSubmittedActions(),
      getDeferredActions(),
      getNotUpgradedWallets(),
    ]);
    return { stuckSubmitted, deferred, notUpgradedWallets };
  };

  return handleAdminRead(req, handler);
}
