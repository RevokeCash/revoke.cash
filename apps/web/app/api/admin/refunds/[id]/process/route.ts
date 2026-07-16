import { recordAuditEvent } from '@revoke.cash/core/audit/events';
import { processRefundRequest } from '@revoke.cash/core/premium/refunds';
import { handleAdminWrite } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import { type Address, isHash } from 'viem';
import { z } from 'zod';

interface Props {
  params: Promise<{ id: string }>;
}

const schemas = {
  params: z.object({ id: z.uuid() }),
  body: z.strictObject({
    refundTxHash: z.string().refine(isHash, { error: 'Invalid transaction hash' }),
  }),
};

export const runtime = 'nodejs';

export async function POST(req: NextRequest, props: Props) {
  const handler = async (adminAddress: Address) => {
    const { params, body } = await parseRequest(req, props, schemas);
    const { outcome, ownerAddress, subscriptionId } = await processRefundRequest(params.id, body.refundTxHash);

    await recordAuditEvent({
      action: 'admin_refund_processed',
      actorAddress: adminAddress,
      targetAddress: ownerAddress,
      subscriptionId: subscriptionId ?? undefined,
      details: { refundRequestId: params.id, refundTxHash: body.refundTxHash, outcome },
    });

    return { outcome };
  };

  return handleAdminWrite(req, handler, 'Failed to process refund request');
}
