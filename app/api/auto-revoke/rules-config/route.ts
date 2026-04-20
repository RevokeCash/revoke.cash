import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { uuidSchema } from 'lib/api/schemas';
import { parseRequest } from 'lib/api/validation';
import { getAddressRulesConfig, switchAutoRevokeRulesSource } from 'lib/auto-revoke/rules';
import { hasActiveUltimateEntitlement } from 'lib/premium/entitlements';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schemas = {
  params: z.undefined(),
  body: z.object({ subscriptionId: uuidSchema.nullable() }).strict(),
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
    const rulesConfig = await getAddressRulesConfig(siweAddress);
    return NextResponse.json(rulesConfig);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rules config';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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
  const { subscriptionId } = data.body;

  try {
    await switchAutoRevokeRulesSource(siweAddress, { subscriptionId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update rules config';
    return NextResponse.json({ message }, { status: 500 });
  }
}
