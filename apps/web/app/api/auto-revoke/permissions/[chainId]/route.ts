import { revokeAutoRevokePermission } from '@revoke.cash/core/auto-revoke/permissions';
import { hasActiveUltimateEntitlement } from '@revoke.cash/core/premium/entitlements';
import { autoRevokeSupportedChainIdSchema } from '@revoke.cash/core/schemas';
import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ chainId: string }>;
}

const schemas = {
  params: z.object({ chainId: autoRevokeSupportedChainIdSchema }),
  body: z.undefined(),
};

export const runtime = 'edge';

export async function DELETE(req: NextRequest, props: Props) {
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_WRITE))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  if (!(await hasActiveUltimateEntitlement(siweAddress))) {
    return NextResponse.json({ message: 'Ultimate subscription required' }, { status: 403 });
  }

  const { data, error } = await parseRequest(req, props, schemas);
  if (error) return error;
  const { params } = data;

  try {
    await revokeAutoRevokePermission(siweAddress, params.chainId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to revoke permission';
    return NextResponse.json({ message }, { status: 500 });
  }
}
