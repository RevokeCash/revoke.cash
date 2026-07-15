import { getChainExplorerUrl, getChainName } from '@revoke.cash/core/chains';
import { REFUND_DEADLINE_DAYS } from '@revoke.cash/core/premium/payment-config';
import type { RefundConfirmationData } from '@revoke.cash/core/premium/refunds';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import {
  BORDER_COLOR,
  CONTENT_WIDTH,
  drawBrandHeader,
  drawLine,
  drawPageFooters,
  formatPdfDate,
  PAGE_MARGIN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from 'lib/pdf';
import PDFDocument from 'pdfkit';

// The acknowledgment of a cancellation (withdrawal) statement on a durable medium, so the
// content is deliberately English-only and mirrors the legal terminology of the terms
export const generateRefundConfirmationPdf = (data: RefundConfirmationData): Promise<Buffer> => {
  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  // Without the company-info block: the confirmation is a receipt to the user, not an invoice
  const titleY = drawBrandHeader(doc, false);

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(TEXT_PRIMARY)
    .text('Subscription Cancellation Confirmation', PAGE_MARGIN, titleY);

  const dividerY = titleY + 18;
  drawLine(doc, PAGE_MARGIN, dividerY, PAGE_MARGIN + CONTENT_WIDTH, BORDER_COLOR, 1);

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(TEXT_PRIMARY)
    .text(
      'This document confirms that Revoke.cash has received your statement of withdrawal (cancellation) for the subscription payment below.',
      PAGE_MARGIN,
      dividerY + 14,
      { width: CONTENT_WIDTH },
    );

  const explorerUrl = getChainExplorerUrl(data.chainId);
  const detailRows: [string, string, string?][] = [
    ['Requested at', formatPdfDate(data.requestedAt)],
    ['Plan', data.planName],
    ['Network', getChainName(data.chainId)],
    [
      'Original payment',
      data.paymentTxHash ?? 'Unknown',
      data.paymentTxHash ? `${explorerUrl}/tx/${data.paymentTxHash}` : undefined,
    ],
    ['Refund amount', formatUsdCents(data.refundAmountUsdCents)],
    ['Refund destination', data.ownerAddress],
  ];

  if (data.refundTxHash) {
    detailRows.push(['Refund transaction', data.refundTxHash, `${explorerUrl}/tx/${data.refundTxHash}`]);
  }

  let y = doc.y + 14;
  for (const [label, value, link] of detailRows) {
    doc.font('Helvetica').fontSize(9).fillColor(TEXT_SECONDARY).text(label, PAGE_MARGIN, y, { width: 130 });
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(link ? '#B07A20' : TEXT_PRIMARY)
      .text(value, PAGE_MARGIN + 130, y, { width: CONTENT_WIDTH - 130, link });
    y += 18;
  }

  drawLine(doc, PAGE_MARGIN, y + 4, PAGE_MARGIN + CONTENT_WIDTH, BORDER_COLOR, 1);

  const statusText = data.processedAt
    ? `The refund was issued on ${formatPdfDate(data.processedAt)}.`
    : `The refund will be issued to the wallet that made the original payment within ${REFUND_DEADLINE_DAYS} days of the request.`;

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(TEXT_PRIMARY)
    .text(statusText, PAGE_MARGIN, y + 18, { width: CONTENT_WIDTH });

  drawPageFooters(doc);

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
};
