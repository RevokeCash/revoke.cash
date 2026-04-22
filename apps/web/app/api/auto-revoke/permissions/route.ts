import {
  getAutoRevokePermissionsByAddress,
  resolvePermissionRecord,
  saveAutoRevokePermission,
} from '@revoke.cash/core/auto-revoke/permissions';
import { hasActiveUltimateEntitlement } from '@revoke.cash/core/premium/entitlements';
import { grantPermissionBodySchema } from 'app/api/auto-revoke/schemas';
import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schemas = {
  params: z.undefined(),
  body: grantPermissionBodySchema,
};

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const siweAddress = await getAuthenticatedSiweAddress(req);
  if (!siweAddress) {
    return NextResponse.json({ message: 'No SIWE session is active' }, { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.PREMIUM_READ))) {
    return NextResponse.json({ message: 'Too many requests, please try again later.' }, { status: 429 });
  }

  try {
    const permissions = await getAutoRevokePermissionsByAddress(siweAddress);
    return NextResponse.json(permissions);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch permissions';
    return NextResponse.json({ message }, { status: 500 });
  }
}

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

  const { data, error } = await parseRequest(req, undefined, schemas);
  if (error) return error;

  try {
    const resolvedPermission = await resolvePermissionRecord(siweAddress, data.body);
    const result = await saveAutoRevokePermission(resolvedPermission);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to grant permission:', error);
    const message = error instanceof Error ? error.message : 'Failed to grant permission';
    return NextResponse.json({ message }, { status: 500 });
  }
}
