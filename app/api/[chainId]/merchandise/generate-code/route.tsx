import { neon } from '@neondatabase/serverless';
import { checkActiveSessionEdge, checkRateLimitAllowedEdge, RateLimiters } from 'lib/api/auth';
import { createViemPublicClientForChain, getChainName } from 'lib/utils/chains';
import type { NextRequest } from 'next/server';
import { getAddress } from 'viem';

interface Props {
  params: {
    chainId: string;
  };
}

export const runtime = 'edge';

export async function POST(req: NextRequest, { params }: Props) {
  if (!(await checkActiveSessionEdge(req))) {
    return new Response(JSON.stringify({ message: 'No API session is active' }), { status: 403 });
  }

  if (!(await checkRateLimitAllowedEdge(req, RateLimiters.MERCH_CODES))) {
    return new Response(JSON.stringify({ message: 'Rate limit exceeded' }), { status: 429 });
  }

  if (!process.env.MERCH_CODES_DATABASE_URL) {
    return new Response(JSON.stringify({ message: 'Cannot generate merch codes' }), { status: 500 });
  }

  const sql = neon(process.env.MERCH_CODES_DATABASE_URL);

  const body = await req.json();
  const publicClient = createViemPublicClientForChain(Number(params.chainId));
  const chainName = getChainName(Number(params.chainId));

  const transaction = await publicClient.getTransaction({
    hash: body.transactionHash,
  });

  if (!transaction) {
    return new Response(JSON.stringify({ message: 'Invalid transaction: donation transaction not found' }), {
      status: 400,
    });
  }

  const code = generateRandomMerchCode();

  try {
    await sql`
      INSERT INTO codes (address, transactionHash, chainName, code)
      VALUES (${getAddress(transaction.from)}, ${transaction.hash}, ${chainName}, ${code})
    `;

    return new Response(JSON.stringify({ code }), { status: 200 });
  } catch (error) {
    const result = await sql`SELECT code FROM codes WHERE address = ${getAddress(transaction.from)}`;
    const existingCode = result[0]?.code;

    if (!existingCode) {
      console.error(error);
      return new Response(JSON.stringify({ message: 'Failed to generate merch code' }), { status: 500 });
    }

    return new Response(JSON.stringify({ code: existingCode }), { status: 200 });
  }
}

// generate a random 9 digit code xxx-xxx-xxx
const generateRandomMerchCode = () => {
  return Math.random().toString().replace('.', '').slice(6, 15).match(/.{3}/g).join('-');
};
