import { getAddressIndexerStates, getAddressSubscriptions } from '@revoke.cash/core/admin/lookup';
import { getAddressRulesConfig } from '@revoke.cash/core/auto-revoke/evaluation/rules';
import { getPermissionsByAddress } from '@revoke.cash/core/auto-revoke/permissions';
import { addressSchema } from '@revoke.cash/core/schemas';
import { handleAdminRead } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ address: string }>;
}

const schemas = {
  params: z.object({ address: addressSchema }),
  body: z.undefined(),
};

export const runtime = 'edge';
export const preferredRegion = ['iad1'];

export async function GET(req: NextRequest, props: Props) {
  const handler = async () => {
    const { params } = await parseRequest(req, props, schemas);

    const [subscriptions, permissions, rulesConfig, indexerStates] = await Promise.all([
      getAddressSubscriptions(params.address),
      getPermissionsByAddress(params.address),
      getAddressRulesConfig(params.address),
      getAddressIndexerStates(params.address),
    ]);

    return { subscriptions, permissions, rulesConfig, indexerStates };
  };

  return handleAdminRead(req, handler, 'Failed to fetch address diagnostic');
}
