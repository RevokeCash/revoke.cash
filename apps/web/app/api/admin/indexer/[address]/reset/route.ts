import { resetAddressIndexing } from '@revoke.cash/core/admin/mutations';
import { recordAuditEvent } from '@revoke.cash/core/audit/events';
import { addressSchema } from '@revoke.cash/core/schemas';
import { handleAdminWrite } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import type { Address } from 'viem';
import { z } from 'zod';

interface Props {
  params: Promise<{ address: string }>;
}

const schemas = {
  params: z.object({ address: addressSchema }),
  body: z.undefined(),
};

export const runtime = 'nodejs';

export async function POST(req: NextRequest, props: Props) {
  const handler = async (adminAddress: Address) => {
    const { params } = await parseRequest(req, props, schemas);
    const resetCount = await resetAddressIndexing(params.address);

    await recordAuditEvent({
      action: 'admin_indexing_reset',
      actorAddress: adminAddress,
      targetAddress: params.address,
      details: { resetChainCount: resetCount },
    });

    return { ok: true, resetCount };
  };

  return handleAdminWrite(req, handler, 'Failed to reset indexing');
}
