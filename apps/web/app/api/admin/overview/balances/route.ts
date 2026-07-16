import { getExecutorGasBalances, getExecutorSpend } from '@revoke.cash/core/admin/executor';
import { handleAdminRead } from 'lib/api/admin';
import type { NextRequest } from 'next/server';

// The balance grid fans out to on-chain RPC calls for every supported chain, so it runs on the
// node runtime. Native token prices are cached by getNativeTokenPriceUsd itself.
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const handler = async () => {
    const [balances, spend30d] = await Promise.all([getExecutorGasBalances(), getExecutorSpend(30)]);
    return { balances, spend30d };
  };

  return handleAdminRead(req, handler);
}
