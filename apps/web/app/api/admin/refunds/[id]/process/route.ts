import { processRefundRequest } from '@revoke.cash/core/premium/refunds';
import { handleAdminWrite } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import { isHash } from 'viem';
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
  const handler = async () => {
    const { params, body } = await parseRequest(req, props, schemas);
    return processRefundRequest(params.id, body.refundTxHash);
  };

  return handleAdminWrite(req, handler, 'Failed to process refund request');
}
