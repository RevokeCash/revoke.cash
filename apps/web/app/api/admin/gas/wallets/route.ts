import { getGasSpendReport } from '@revoke.cash/core/admin/gas-spend';
import { buildGasDepositSummary, type GasDeposit, getGasWalletReport } from '@revoke.cash/core/admin/gas-wallets';
import { generateGasStatementPdf } from 'lib/admin/gas-statement';
import { periodQuerySchema, toUtcPeriod } from 'lib/admin/period';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { formatEther } from 'viem';
import { z } from 'zod';

export const maxDuration = 60;

const schemas = {
  params: z.undefined(),
  body: z.undefined(),
  query: periodQuerySchema.extend({
    format: z.enum(['json', 'csv', 'pdf']).default('json'),
  }),
};

export async function GET(req: NextRequest) {
  try {
    await authorizeRequest(req, { auth: 'siwe', requireAdmin: true, rateLimiter: RateLimiters.PREMIUM_READ });
    const { query } = await parseRequest(req, undefined, schemas);
    const { from, to } = toUtcPeriod(query.from, query.to);

    if (query.format === 'pdf') {
      const [walletReport, spendReport] = await Promise.all([
        getGasWalletReport(from, to),
        getGasSpendReport(from, to),
      ]);
      const pdf = await generateGasStatementPdf({ walletReport, spendReport, from, to });
      return new NextResponse(new Uint8Array(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="gas-statement-${query.from}-to-${query.to}.pdf"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    const { deposits, balances } = await getGasWalletReport(from, to);

    if (query.format === 'csv') {
      return new NextResponse(buildGasDepositsCsv(deposits), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="gas-deposits-${query.from}-${query.to}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json(
      { depositCount: deposits.length, depositSummary: buildGasDepositSummary(deposits), balances },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to load gas wallet report' });
  }
}

const buildGasDepositsCsv = (deposits: GasDeposit[]): string => {
  const header = 'timestamp,chainId,lane,walletAddress,senderAddress,txHash,amount,nativeToken,priceUsd,valueUsdCents';
  const rows = deposits.map((deposit) =>
    [
      deposit.timestamp.toISOString(),
      deposit.chainId,
      deposit.lane,
      deposit.walletAddress,
      deposit.senderAddress,
      deposit.transactionHash,
      formatEther(deposit.amountWei),
      deposit.nativeToken,
      deposit.priceUsd,
      deposit.valueUsdCents,
    ].join(','),
  );

  return [header, ...rows].join('\n');
};
