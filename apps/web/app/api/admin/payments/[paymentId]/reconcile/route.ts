import { reconcilePaymentAsAdmin } from '@revoke.cash/core/admin/mutations';
import { ApiError } from '@revoke.cash/core/utils/errors';
import { handleAdminWrite } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ paymentId: string }>;
}

const schemas = {
  params: z.object({ paymentId: z.uuid() }),
  body: z.undefined(),
};

// Reconciliation scans transfer logs via RPC, so it runs on the node runtime
export const runtime = 'nodejs';

export async function POST(req: NextRequest, props: Props) {
  const handler = async () => {
    const { params } = await parseRequest(req, props, schemas);

    const paymentStatus = await reconcilePaymentAsAdmin(params.paymentId);
    if (!paymentStatus) throw new ApiError(404, 'Payment not found');

    return paymentStatus;
  };

  return handleAdminWrite(req, handler, 'Failed to reconcile payment');
}
