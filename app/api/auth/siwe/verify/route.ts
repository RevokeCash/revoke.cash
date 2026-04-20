import { ChainId } from '@revoke.cash/chains';
import { storeSessionEdge, storeSiweCookieEdge } from 'lib/api/auth';
import { addressSchema, hexStringSchema } from 'lib/api/schemas';
import { parseRequest } from 'lib/api/validation';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'edge';

const schemas = {
  params: z.undefined(),
  body: z
    .object({
      address: addressSchema,
      message: z.string().min(1),
      signature: hexStringSchema,
    })
    .strict(),
};

export async function POST(req: NextRequest) {
  const { data, error } = await parseRequest(req, undefined, schemas);
  if (error) return error;
  const { message, address, signature } = data.body;

  const publicClient = createViemPublicClientForChain(ChainId.EthereumMainnet);

  const isValid = await publicClient.verifySiweMessage({
    message,
    signature,
    address,
    domain: undefined,
    // domain: process.env.NODE_ENV === 'production' ? 'revoke.cash' : undefined,
  });

  if (!isValid) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const siwe = { address, message, signature };
  const res = NextResponse.json({ ok: true });
  await storeSessionEdge(req, res, { siwe });
  await storeSiweCookieEdge(req, res, siwe);
  return res;
}
