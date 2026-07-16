import { getAdminSubscription } from '@revoke.cash/core/admin/subscriptions';
import { ApiError } from '@revoke.cash/core/utils/errors';
import { handleAdminRead } from 'lib/api/admin';
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

export const runtime = 'edge';

export async function GET(req: NextRequest, props: Props) {
  const handler = async () => {
    const { params } = await parseRequest(req, props, schemas);

    const subscription = await getAdminSubscription(params.id);
    if (!subscription) throw new ApiError(404, 'Subscription not found');

    return subscription;
  };

  return handleAdminRead(req, handler);
}
