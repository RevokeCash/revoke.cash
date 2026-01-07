import { ChainId } from '@revoke.cash/chains';
import { storeSessionEdge } from 'lib/api/auth';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { address, message, signature } = await req.json();

  const publicClient = createViemPublicClientForChain(ChainId.EthereumMainnet);

  const isValid = await publicClient.verifySiweMessage({
    message,
    signature,
    address,
    domain: process.env.NODE_ENV === 'production' ? 'revoke.cash' : undefined,
  });

  if (!isValid) {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }

  const res = new NextResponse(JSON.stringify({ ok: true }), { status: 200 });
  await storeSessionEdge(req, res, { siwe: { address, message, signature } });
  return res;
}
