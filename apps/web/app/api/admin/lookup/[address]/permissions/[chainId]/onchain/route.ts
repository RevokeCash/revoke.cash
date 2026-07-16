import { findActivePermission, isPermissionEnabledOnChain } from '@revoke.cash/core/auto-revoke/permissions';
import { addressSchema, chainIdSchema } from '@revoke.cash/core/schemas';
import { handleAdminRead } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ address: string; chainId: string }>;
}

const schemas = {
  params: z.object({ address: addressSchema, chainId: chainIdSchema }),
  body: z.undefined(),
};

// The on-chain check reads the DelegationManager contract through a viem public client
export const runtime = 'nodejs';

export async function GET(req: NextRequest, props: Props) {
  const handler = async () => {
    const { params } = await parseRequest(req, props, schemas);

    const permission = await findActivePermission(params.address, params.chainId);
    const enabledOnChain = permission ? await isPermissionEnabledOnChain(permission) : null;

    return { enabledOnChain };
  };

  return handleAdminRead(req, handler, 'Failed to check on-chain permission status');
}
