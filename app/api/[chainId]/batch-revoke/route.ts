import { neon } from '@neondatabase/serverless';
import { FEE_SPONSORS } from 'components/allowances/controls/batch-revoke/fee';
import { checkActiveSessionEdge, checkRateLimitAllowedEdge, getClientCountryEdge, RateLimiters } from 'lib/api/auth';
import { isTestnetChain } from 'lib/utils/chains';
import type { NextRequest } from 'next/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  chainId: string;
}

export const runtime = 'edge';

export async function POST(req: NextRequest, { params }: Props) {
  const { chainId: chainIdString } = await params;

  if (!(await checkActiveSessionEdge(req))) {
    return new Response(JSON.stringify({ message: 'No API session is active' }), { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.BATCH_REVOKE))) {
    return new Response(JSON.stringify({ message: 'Too many requests, please try again later.' }), { status: 429 });
  }

  if (!process.env.ANALYTICS_DATABASE_URL) {
    return new Response(JSON.stringify({ message: 'Cannot record batch revoke' }), { status: 500 });
  }

  const sql = neon(process.env.ANALYTICS_DATABASE_URL);

  const chainId = Number(chainIdString);
  const body = await req.json();

  const transactionHash = body.transactionHash;
  const userAddress = body.userAddress;
  const feePaid = BigInt(((Number(body.feePaid) ?? 0) * 100).toFixed(0));
  const sponsor = FEE_SPONSORS[chainId] ?? null;
  const country = getClientCountryEdge(req);

  try {
    await sql`
      INSERT INTO batch_revokes (chain_id, fee_transaction_hash, user_address, fee_paid, is_testnet, vat_region, sponsor, timestamp)
      VALUES (${chainId}, ${transactionHash}, ${userAddress}, ${feePaid}, ${isTestnetChain(chainId)}, ${country}, ${sponsor}, ${new Date().toISOString()})
    `;

    return new Response(JSON.stringify({}), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Failed to record batch revoke' }), { status: 500 });
  }
}
