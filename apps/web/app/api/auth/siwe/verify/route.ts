import { ChainId } from '@revoke.cash/chains';
import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { addressSchema, hexStringSchema } from '@revoke.cash/core/schemas';
import {
  destroySiweNonceCookieEdge,
  getSiweNonceCookieEdge,
  storeSessionEdge,
  storeSiweCookieEdge,
} from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'edge';

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
    const { body } = await parseRequest(req, undefined, schemas);
    const { message, address, signature } = body;

    const nonce = await getSiweNonceCookieEdge(req);
    if (!nonce) {
      return NextResponse.json({ ok: false, message: 'SIWE nonce is missing or expired' }, { status: 401 });
    }

    const domain = req.headers.get('host');
    if (!domain) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const publicClient = createViemPublicClientForChain(ChainId.EthereumMainnet);
    const isValid = await publicClient.verifySiweMessage({ message, signature, address, nonce, domain });

    if (!isValid) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const siwe = { address, message, signature };
    const res = NextResponse.json({ ok: true });
    await storeSessionEdge(req, res, { siwe });
    await storeSiweCookieEdge(req, res, siwe);
    await destroySiweNonceCookieEdge(req, res);
    return res;
  } catch (error) {
    return handleApiRouteError(error);
  }
}
