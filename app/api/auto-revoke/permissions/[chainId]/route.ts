import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { parseRouteParams } from 'lib/api/validation';
import { revokeAutoRevokePermission } from 'lib/auto-revoke/permissions';
import { chainIdRouteParamsSchema } from 'lib/auto-revoke/schemas';
import { hasActiveUltimateEntitlement } from 'lib/premium/entitlements';
import { type NextRequest, NextResponse } from 'next/server';

interface Props {
  params: Promise<{ chainId: string }>;
}

export const runtime = 'edge';

export async function DELETE(req: NextRequest, { params }: Props) {
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

  const { data, error: validationError } = parseRouteParams(await params, chainIdRouteParamsSchema);
  if (validationError) return validationError;

  try {
    await revokeAutoRevokePermission(siweAddress, data.chainId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to revoke permission';
    return NextResponse.json({ message }, { status: 500 });
  }
}
