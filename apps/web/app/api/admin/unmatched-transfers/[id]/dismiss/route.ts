import { recordAuditEvent } from '@revoke.cash/core/audit/events';
import { dismissUnmatchedTransfer } from '@revoke.cash/core/premium/unmatched-transfers';
import { ApiError } from '@revoke.cash/core/utils/errors';
import { handleAdminWrite } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import type { Address } from 'viem';
import { z } from 'zod';

interface Props {
  params: Promise<{ id: string }>;
}

const schemas = {
  params: z.object({ id: z.uuid() }),
  body: z.strictObject({ note: z.string().trim().max(500).optional() }),
};

// Marks an unmatched transfer as handled. The note records what happened with the money, for example the hash of a
// refund transaction, because nothing else links the transfer to that outcome.
export async function POST(req: NextRequest, props: Props) {
  const handler = async (adminAddress: Address) => {
    const { params, body } = await parseRequest(req, props, schemas);
    const note = body.note || null;

    const dismissedTransfer = await dismissUnmatchedTransfer(params.id, note);
    if (!dismissedTransfer) throw new ApiError(404, 'Unmatched transfer is not open');

    await recordAuditEvent({
      action: 'admin_unmatched_transfer_dismissed',
      actorAddress: adminAddress,
      targetAddress: dismissedTransfer.senderAddress,
      chainId: dismissedTransfer.chainId,
      details: { unmatchedTransferId: params.id, transactionHash: dismissedTransfer.transactionHash, note },
    });

    return { success: true };
  };

  return handleAdminWrite(req, handler, 'Failed to dismiss unmatched transfer');
}
