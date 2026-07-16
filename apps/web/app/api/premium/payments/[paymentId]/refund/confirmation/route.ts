import { getRefundConfirmationData } from '@revoke.cash/core/premium/refunds';
import { authorizeRequest, RateLimiters } from 'lib/api/auth';
import { handleApiRouteError } from 'lib/api/errors';
import { parseRequest } from 'lib/api/validation';
import { generateRefundConfirmationPdf } from 'lib/premium/refund-confirmation';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

interface Props {
  params: Promise<{ paymentId: string }>;
}

const schemas = {
  params: z.object({ paymentId: z.uuid() }),
  body: z.undefined(),
};

// PDF rendering runs on the node runtime: pdfkit loads its font data from disk
export const runtime = 'nodejs';

export async function GET(req: NextRequest, props: Props) {
  try {
    const { siweAddress } = await authorizeRequest(req, {
      auth: 'siwe',
      rateLimiter: RateLimiters.PREMIUM_READ,
    });
    const { params } = await parseRequest(req, props, schemas);

    const confirmationData = await getRefundConfirmationData(params.paymentId, siweAddress);
    if (!confirmationData) {
      return NextResponse.json({ message: 'Refund request not found' }, { status: 404 });
    }

    const pdf = await generateRefundConfirmationPdf(confirmationData);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="revoke-cancellation-${params.paymentId}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return handleApiRouteError(error, { errorMessage: 'Failed to generate cancellation confirmation' });
  }
}
