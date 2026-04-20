import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { parseJsonBody } from 'lib/api/validation';
import { resolvePermissionRecord, syncAutoRevokePermissions } from 'lib/auto-revoke/permissions';
import { syncPermissionsBodySchema } from 'lib/auto-revoke/schemas';
import { hasActiveUltimateEntitlement } from 'lib/premium/entitlements';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
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

  const { data, error: validationError } = await parseJsonBody(req, syncPermissionsBodySchema);
  if (validationError) return validationError;

  try {
    const resolvedPermissions = await Promise.all(
      data.permissions.map((item) => resolvePermissionRecord(siweAddress, item)),
    );
    const results = await syncAutoRevokePermissions(siweAddress, resolvedPermissions);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Failed to sync permissions:', error);
    const message = error instanceof Error ? error.message : 'Failed to sync permissions';
    return NextResponse.json({ message }, { status: 500 });
  }
}
