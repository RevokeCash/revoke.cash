import { EU_VAT_RATES, type FeeRecord, formatVatRate, type RegionSummary } from '@revoke.cash/core/admin/revenue';
import { getChainExplorerUrl, getChainName } from '@revoke.cash/core/chains';
import { formatUsdCents } from '@revoke.cash/core/utils/formatting';
import {
  ACCENT_LIGHT,
  BORDER_COLOR,
  CONTENT_WIDTH,
  drawAccentBar,
  drawBrandHeader,
  drawLine,
  drawPageFooters,
  drawSectionTitle,
  ensureSpace,
  formatPdfDate,
  PAGE_MARGIN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from 'lib/pdf';
import PDFDocument from 'pdfkit';

interface Column {
  label: string;
  x: number;
  width: number;
  align?: 'left' | 'right' | 'center';
}

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
  drawInvoiceHeader(doc, title, from, to, records.length, totalRevenue);
  drawSectionTitle(doc, 'Revenue by VAT Region');

  const summaryColumns: Column[] = [
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

  const txColumns: Column[] = [
    { label: 'Date/Time (UTC)', x: PAGE_MARGIN, width: 115 },
    { label: 'Chain', x: PAGE_MARGIN + 115, width: 75 },
    { label: 'Transaction Hash', x: PAGE_MARGIN + 190, width: 140 },
    { label: 'Region', x: PAGE_MARGIN + 330, width: 40, align: 'center' },
    { label: 'Amount', x: PAGE_MARGIN + 370, width: 60, align: 'right' },
    { label: 'VAT', x: PAGE_MARGIN + 430, width: 65, align: 'right' },
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
    const explorerUrl = getChainExplorerUrl(record.chainId);
    const txUrl = record.feeTransactionHash ? `${explorerUrl}/tx/${record.feeTransactionHash}` : null;
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

// --- PDF Drawing Helpers ---

const drawTableHeaderRow = (doc: PDFKit.PDFDocument, columns: Column[], y: number): number => {
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 20).fill(ACCENT_LIGHT);

  doc.font('Helvetica-Bold').fontSize(8).fillColor(TEXT_PRIMARY);
  for (const col of columns) {
    doc.text(col.label, col.x + 6, y + 6, {
      width: col.width - 12,
      align: col.align ?? 'left',
    });
  }

  return y + 20;
};

const drawTableRow = (
  doc: PDFKit.PDFDocument,
  columns: Column[],
  values: string[],
  y: number,
  options?: { bold?: boolean; bgColor?: string; link?: { colIndex: number; url: string } },
): number => {
  const rowHeight = 18;

  if (options?.bgColor) {
    doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight).fill(options.bgColor);
  }

  doc
    .font(options?.bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(8)
    .fillColor(TEXT_PRIMARY);

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const isLink = options?.link?.colIndex === i && options?.link?.url;

    if (isLink) {
      doc.fillColor('#B07A20').text(values[i], col.x + 6, y + 5, {
        width: col.width - 12,
        align: col.align ?? 'left',
        link: options!.link!.url,
      });
      doc.fillColor(TEXT_PRIMARY);
    } else {
      doc.text(values[i], col.x + 6, y + 5, {
        width: col.width - 12,
        align: col.align ?? 'left',
      });
    }
  }

  drawLine(doc, PAGE_MARGIN, y + rowHeight, PAGE_MARGIN + CONTENT_WIDTH, BORDER_COLOR);

  return y + rowHeight;
};

const drawInvoiceHeader = (
  doc: PDFKit.PDFDocument,
  title: string,
  from: Date,
  to: Date,
  totalRecords: number,
  totalRevenue: number,
) => {
  const titleY = drawBrandHeader(doc);

  // Title
  doc.font('Helvetica-Bold').fontSize(12).fillColor(TEXT_PRIMARY).text(title, PAGE_MARGIN, titleY);

  // Divider
  const dividerY = titleY + 18;
  drawLine(doc, PAGE_MARGIN, dividerY, PAGE_MARGIN + CONTENT_WIDTH, BORDER_COLOR, 1);

  // Info grid
  const infoY = dividerY + 12;
  const leftCol = PAGE_MARGIN;
  const rightCol = PAGE_MARGIN + CONTENT_WIDTH / 2;

  doc.font('Helvetica').fontSize(8).fillColor(TEXT_SECONDARY);
  doc.text('Period', leftCol, infoY);
  doc.text('Generated', leftCol, infoY + 22);
  doc.text('Transactions', rightCol, infoY);
  doc.text('Total Revenue', rightCol, infoY + 22);

  doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT_PRIMARY);
  doc.text(formatPeriodLabel(from, to), leftCol + 80, infoY);
  doc.text(new Date().toISOString().slice(0, 10), leftCol + 80, infoY + 22);
  doc.text(totalRecords.toLocaleString(), rightCol + 90, infoY);
  doc.text(formatUsdCents(totalRevenue), rightCol + 90, infoY + 22);

  // Divider
  drawLine(doc, PAGE_MARGIN, infoY + 44, PAGE_MARGIN + CONTENT_WIDTH, BORDER_COLOR, 1);

  doc.y = infoY + 58;
};

const formatPeriodLabel = (from: Date, to: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fromMonth = months[from.getUTCMonth()];
  const toMonth = months[to.getUTCMonth()];
  const year = from.getUTCFullYear();
  return `${fromMonth} ${from.getUTCDate()} – ${toMonth} ${to.getUTCDate()}, ${year}`;
};
