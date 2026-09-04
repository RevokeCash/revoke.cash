import { recordAuditEvent } from '@revoke.cash/core/audit/events';
import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { ChainId } from '@revoke.cash/core/chains/ids';
import { addressSchema, hexStringSchema } from '@revoke.cash/core/schemas';
import {
  destroySiweNonceCookie,
  getSiweNonceCookie,
  RateLimiters,
  requireRateLimit,
  storeSession,
  storeSiweWallet,
} from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schemas = {
  params: z.undefined(),
  body: z.strictObject({
    address: addressSchema,
    message: z.string().min(1),
    signature: hexStringSchema,
  }),
};

export async function POST(req: NextRequest) {
  try {
    await requireRateLimit(req, RateLimiters.AUTH);
    const { body } = await parseRequest(req, undefined, schemas);
    const { message, address, signature } = body;

    const nonce = await getSiweNonceCookie(req);
    if (!nonce) {
      return NextResponse.json({ ok: false, message: 'SIWE nonce is missing or expired' }, { status: 401 });
    }

    const domain = req.headers.get('host');
    if (!domain) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const publicClient = createViemPublicClientForChain(ChainId.Ethereum);
    const isValid = await publicClient.verifySiweMessage({ message, signature, address, nonce, domain });

    if (!isValid) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const siwe = { address, verifiedAt: Date.now() };
    const res = NextResponse.json({ ok: true });
    await storeSession(req, res, { siwe });
    await storeSiweWallet(req, res, siwe);
    await destroySiweNonceCookie(req, res);

    await recordAuditEvent({ action: 'signed_in', actorAddress: address, details: {} });

    return res;
  } catch (error) {
    return handleApiRouteError(error);
  }
}
