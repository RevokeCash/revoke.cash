import { resetAddressIndexing } from '@revoke.cash/core/admin/mutations';
import { addressSchema } from '@revoke.cash/core/schemas';
import { handleAdminWrite } from 'lib/api/admin';
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

export const runtime = 'nodejs';

export async function POST(req: NextRequest, props: Props) {
  const handler = async () => {
    const { params } = await parseRequest(req, props, schemas);
    const resetCount = await resetAddressIndexing(params.address);
    return { ok: true, resetCount };
  };

  return handleAdminWrite(req, handler, 'Failed to reset indexing');
}
