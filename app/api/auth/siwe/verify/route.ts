import { ChainId } from '@revoke.cash/chains';
import { storeSessionEdge, storeSiweCookieEdge } from 'lib/api/auth';
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
