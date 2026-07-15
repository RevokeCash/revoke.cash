import { dismissRefundRequest } from '@revoke.cash/core/premium/refunds';
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

// For unfulfillable or abusive requests (e.g. the payment was reversed after a reorg, or the
// user changed their mind via support); dismissed requests are terminal and free the payment
// for a new request while it remains inside the refund window
export async function POST(req: NextRequest, props: Props) {
  const handler = async () => {
    const { params } = await parseRequest(req, props, schemas);
    return dismissRefundRequest(params.id);
  };

  return handleAdminWrite(req, handler, 'Failed to dismiss refund request');
}
