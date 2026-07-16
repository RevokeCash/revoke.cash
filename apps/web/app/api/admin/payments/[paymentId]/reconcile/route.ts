import { reconcilePaymentAsAdmin } from '@revoke.cash/core/admin/mutations';
import { recordAuditEvent } from '@revoke.cash/core/audit/events';
import { ApiError } from '@revoke.cash/core/utils/errors';
import { handleAdminWrite } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import type { Address } from 'viem';
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
  const handler = async (adminAddress: Address) => {
    const { params } = await parseRequest(req, props, schemas);

    const reconciled = await reconcilePaymentAsAdmin(params.paymentId);
    if (!reconciled) throw new ApiError(404, 'Payment not found');

    const { ownerAddress, ...paymentStatus } = reconciled;

    await recordAuditEvent({
      action: 'admin_payment_reconciled',
      actorAddress: adminAddress,
      targetAddress: ownerAddress,
      details: { paymentId: params.paymentId, status: paymentStatus.status },
    });

    return paymentStatus;
  };

  return handleAdminWrite(req, handler, 'Failed to reconcile payment');
}
