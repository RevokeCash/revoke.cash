import { grantSubscriptionAsAdmin } from '@revoke.cash/core/admin/mutations';
import { recordAuditEvent } from '@revoke.cash/core/audit/events';
import { addressSchema } from '@revoke.cash/core/schemas';
import { ApiError } from '@revoke.cash/core/utils/errors';
import { handleAdminWrite } from 'lib/api/admin';
import { parseRequest } from 'lib/api/validation';
import type { NextRequest } from 'next/server';
import type { Address } from 'viem';
import { z } from 'zod';

const schemas = {
  params: z.undefined(),
  body: z.strictObject({
    ownerAddress: addressSchema,
    planId: z.string().min(1),
    durationDays: z.number().int().min(1).max(3650),
    reason: z.string().trim().max(500).optional(),
  }),
};

// Transactional path with advisory locks, so it runs on the node runtime like the rebuild route
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const handler = async (adminAddress: Address) => {
    const { body } = await parseRequest(req, undefined, schemas);

    const granted = await grantSubscriptionAsAdmin({
      ownerAddress: body.ownerAddress,
      planId: body.planId,
      durationDays: body.durationDays,
      reason: body.reason || null,
      grantedBy: adminAddress,
    });
    if (!granted) throw new ApiError(404, 'Plan not found');

    await recordAuditEvent({
      action: 'admin_subscription_granted',
      actorAddress: adminAddress,
      targetAddress: body.ownerAddress,
      subscriptionId: granted.subscriptionId,
      details: {
        paymentId: granted.paymentId,
        planId: body.planId,
        durationDays: body.durationDays,
        reason: body.reason || null,
      },
    });

    return granted;
  };

  return handleAdminWrite(req, handler, 'Failed to grant subscription');
}
