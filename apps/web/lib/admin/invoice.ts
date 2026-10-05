import { EU_VAT_RATES, type FeeRecord, formatVatRate, type RegionSummary } from '@revoke.cash/core/admin/revenue';
import { getChainConfig, getChainName } from '@revoke.cash/core/chains';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import {
  ACCENT_LIGHT,
  CONTENT_WIDTH,
  drawAccentBar,
  drawDocumentHeader,
  drawLine,
  drawPageFooters,
  drawSectionTitle,
  drawTableHeaderRow,
  drawTableRow,
  ensureSpace,
  formatPdfDate,
  formatPeriodLabel,
  PAGE_MARGIN,
  type PdfTableColumn,
  TEXT_PRIMARY,
} from 'lib/pdf';
import PDFDocument from 'pdfkit';

interface GeneratePdfOptions {
  title: string;
  records: FeeRecord[];
  summary: RegionSummary[];
  from: Date;
  to: Date;
}

export const generatePdf = ({ title, records, summary, from, to }: GeneratePdfOptions): Promise<Buffer> => {
  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const totalRevenue = summary.reduce((sum, r) => sum + r.revenue, 0);
  const totalVat = summary.reduce((sum, r) => sum + r.vatAmount, 0);

  // --- Page 1: Header + VAT Summary ---
  drawDocumentHeader(
    doc,
    title,
    [
      { label: 'Period', value: formatPeriodLabel(from, to) },
      { label: 'Generated', value: new Date().toISOString().slice(0, 10) },
    ],
    [
      { label: 'Transactions', value: records.length.toLocaleString() },
      { label: 'Total Revenue', value: formatUsdCents(totalRevenue) },
    ],
  );
  drawSectionTitle(doc, 'Revenue by VAT Region');

  const summaryColumns: PdfTableColumn[] = [
    { label: 'Region', x: PAGE_MARGIN, width: 190 },
    { label: 'Revenue (USD)', x: PAGE_MARGIN + 190, width: 110, align: 'right' },
    { label: 'VAT Rate', x: PAGE_MARGIN + 300, width: 80, align: 'right' },
    { label: 'VAT Amount (USD)', x: PAGE_MARGIN + 380, width: 115, align: 'right' },
  ];

  let y = drawTableHeaderRow(doc, summaryColumns, doc.y);

  for (let i = 0; i < summary.length; i++) {
    const row = summary[i];
    y = ensureSpace(doc, 18);
    y = drawTableRow(
      doc,
      summaryColumns,
      [
        row.region,
        formatUsdCents(row.revenue),
        row.vatRate > 0 ? formatVatRate(row.vatRate) : '—',
        row.vatRate > 0 ? formatUsdCents(row.vatAmount) : '—',
      ],
      y,
      { bgColor: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB' },
    );
    doc.y = y;
  }

  // Totals row
  y = ensureSpace(doc, 24);
  y += 2;
  drawLine(doc, PAGE_MARGIN, y, PAGE_MARGIN + CONTENT_WIDTH, TEXT_PRIMARY, 1);
  y = drawTableRow(doc, summaryColumns, ['TOTAL', formatUsdCents(totalRevenue), '', formatUsdCents(totalVat)], y + 2, {
    bold: true,
    bgColor: ACCENT_LIGHT,
  });
  doc.y = y;

  // --- Page 2+: Transaction Details ---
  doc.addPage();
  drawAccentBar(doc);
  doc.y = PAGE_MARGIN + 10;
  drawSectionTitle(doc, 'Transaction Details');

  const txColumns: PdfTableColumn[] = [
    { label: 'Date/Time (UTC)', x: PAGE_MARGIN, width: 110 },
    { label: 'Chain', x: PAGE_MARGIN + 110, width: 82 },
    { label: 'Transaction Hash', x: PAGE_MARGIN + 192, width: 128 },
    { label: 'Region', x: PAGE_MARGIN + 320, width: 40, align: 'center' },
    { label: 'Amount', x: PAGE_MARGIN + 360, width: 50, align: 'right' },
    { label: 'VAT', x: PAGE_MARGIN + 410, width: 85, align: 'right' },
  ];

  y = drawTableHeaderRow(doc, txColumns, doc.y);

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    y = ensureSpace(doc, 18);

    // Re-draw header after page break
    if (y === PAGE_MARGIN) {
      drawAccentBar(doc);
      y = drawTableHeaderRow(doc, txColumns, y + 10);
    }

    const txHash = record.feeTransactionHash ? `${record.feeTransactionHash.slice(0, 22)}...` : '—';
    const chainName = getChainName(record.chainId);
    // Fees paid on chains that were removed later have no explorer link
    const explorerUrl = getChainConfig(record.chainId)?.getExplorerUrl();
    const txUrl = record.feeTransactionHash && explorerUrl ? `${explorerUrl}/tx/${record.feeTransactionHash}` : null;
    const region = record.vatRegion?.trim().toUpperCase() ?? '—';
    const vatRate = EU_VAT_RATES[region]?.rate ?? 0;
    const vatAmount = Math.round((record.feeUsdCents * vatRate) / (1 + vatRate));
    const vatLabel = vatRate > 0 ? `${formatUsdCents(vatAmount)} (${formatVatRate(vatRate)})` : '';

    y = drawTableRow(
      doc,
      txColumns,
      [formatPdfDate(record.timestamp), chainName, txHash, region, formatUsdCents(record.feeUsdCents), vatLabel],
      y,
      {
        bgColor: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
        link: txUrl ? { colIndex: 2, url: txUrl } : undefined,
      },
    );
    doc.y = y;
  }

  drawPageFooters(doc);

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
};
