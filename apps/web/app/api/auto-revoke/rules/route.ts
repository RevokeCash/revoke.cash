import { getAddressRules, upsertAddressRules } from '@revoke.cash/core/auto-revoke/rules';
import { hasActiveUltimateEntitlement } from '@revoke.cash/core/premium/entitlements';
import { rulesDataBodySchema } from 'app/api/auto-revoke/schemas';
import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schemas = {
  params: z.undefined(),
  body: rulesDataBodySchema,
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
    const rules = await getAddressRules(siweAddress);
    if (!rules) {
      return NextResponse.json({ message: 'No custom rules configured' }, { status: 404 });
    }

    return NextResponse.json({
      riskDetectionEnabled: rules.riskDetectionEnabled,
      riskSensitivity: rules.riskSensitivity,
      staleApprovalEnabled: rules.staleApprovalEnabled,
      staleApprovalThresholdDays: rules.staleApprovalThresholdDays ?? 30,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch rules';
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

  try {
    await upsertAddressRules(siweAddress, data.body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update rules';
    return NextResponse.json({ message }, { status: 500 });
  }
}
