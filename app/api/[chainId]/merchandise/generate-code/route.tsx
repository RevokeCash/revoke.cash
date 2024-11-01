import { neon } from '@neondatabase/serverless';
import { checkActiveSessionEdge, checkRateLimitAllowedEdge, RateLimiters } from 'lib/api/auth';
import { DONATION_ADDRESS } from 'lib/constants';
import {
  createViemPublicClientForChain,
  getChainName,
  getChainNativeToken,
  getDefaultDonationAmount,
} from 'lib/utils/chains';
import { NextRequest } from 'next/server';
import { getAddress, parseEther } from 'viem';

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

  // TODO: re-enable this check after testing is done
  // if (!CHAIN_SELECT_MAINNETS.includes(Number(params.chainId))) {
  //   return new Response(JSON.stringify({ message: 'Chain not supported' }), { status: 400 });
  // }

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

  if (getAddress(transaction.to) !== DONATION_ADDRESS) {
    return new Response(JSON.stringify({ message: 'Invalid transaction: does not send to donation address' }), {
      status: 400,
    });
  }

  // Calculate the lowest donation amount for this chain (default donation amount / 2 with a small buffer)
  const defaultDonationAmount = getDefaultDonationAmount(getChainNativeToken(Number(params.chainId))) || '0';
  const lowestDonationAmount = Number(defaultDonationAmount) / 2.2;

  if (transaction.value < parseEther(lowestDonationAmount.toFixed(18))) {
    return new Response(
      JSON.stringify({ message: 'Invalid transaction: does not send at least the lowest donation amount' }),
      { status: 400 },
    );
  }

  const code = generateRandomMerchCode();

  try {
    await sql`
      INSERT INTO codes (address, donationTransactionHash, chainName, code)
      VALUES (${getAddress(transaction.from)}, ${transaction.hash}, ${chainName}, ${code})
    `;

    return new Response(JSON.stringify({ code }), { status: 200 });
  } catch (error) {
    const result = await sql`SELECT code FROM codes WHERE address = ${getAddress(transaction.from)}`;
    const existingCode = result[0].code;
    return new Response(JSON.stringify({ code: existingCode }), { status: 200 });
  }
}

// generate a random 9 digit code xxx-xxx-xxx
const generateRandomMerchCode = () => {
  return Math.random().toString().replace('.', '').slice(6, 15).match(/.{3}/g).join('-');
};
