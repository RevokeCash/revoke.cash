import { checkRateLimitAllowedEdge, getAuthenticatedSiweAddress, RateLimiters } from 'lib/api/auth';
import { parseJsonBody } from 'lib/api/validation';
import { getAddressRules, upsertAddressRules } from 'lib/auto-revoke/rules';
import { rulesDataSchema } from 'lib/auto-revoke/schemas';
import { hasActiveUltimateEntitlement } from 'lib/premium/entitlements';
import { type NextRequest, NextResponse } from 'next/server';

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

  const { data, error: validationError } = await parseJsonBody(req, rulesDataSchema);
  if (validationError) return validationError;

  try {
    await upsertAddressRules(siweAddress, data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update rules';
    return NextResponse.json({ message }, { status: 500 });
  }
}
