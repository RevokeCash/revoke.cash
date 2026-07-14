import { rebuildSubscriptionAsAdmin } from '@revoke.cash/core/admin/mutations';
import { ApiError } from '@revoke.cash/core/utils/errors';
import { handleAdminWrite } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ id: string }>;
}

const schemas = {
  params: z.object({ id: z.uuid() }),
  body: z.undefined(),
};

export const runtime = 'nodejs';

export async function POST(req: NextRequest, props: Props) {
  const handler = async () => {
    const { params } = await parseRequest(req, props, schemas);

    const rebuilt = await rebuildSubscriptionAsAdmin(params.id);
    if (!rebuilt) throw new ApiError(404, 'Subscription not found');

    return { ok: true };
  };

  return handleAdminWrite(req, handler, 'Failed to rebuild subscription');
}
