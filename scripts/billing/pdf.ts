import fs from 'node:fs';
import path from 'node:path';
import { type DocumentedChainId, getChainExplorerUrl, getChainName } from 'lib/utils/chains';
import PDFDocument from 'pdfkit';
import {
  EU_VAT_RATES,
  type FeeRecord,
  formatDate,
  formatPercent,
  formatPeriodLabel,
  formatUsd,
  type RegionSummary,
} from './utils';

// Design constants
const ACCENT_COLOR = '#fdb952'; // Revoke brand orange
const ACCENT_LIGHT = '#FEF7EC'; // Light orange tint
const TEXT_PRIMARY = '#111827'; // Gray-900
const TEXT_SECONDARY = '#6B7280'; // Gray-500
const BORDER_COLOR = '#E5E7EB'; // Gray-200
const PAGE_MARGIN = 50;
const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89; // A4
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

interface Column {
  label: string;
  x: number;
  width: number;
  align?: 'left' | 'right' | 'center';
}

export interface GeneratePdfOptions {
  title: string;
  records: FeeRecord[];
  summary: RegionSummary[];
  from: Date;
  to: Date;
  outputPath: string;
}

export const generatePdf = ({ title, records, summary, from, to, outputPath }: GeneratePdfOptions): Promise<void> => {
  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

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
    y = ensureSpace(doc, 18, () => doc.addPage());
    y = drawTableRow(
      doc,
      summaryColumns,
      [
        row.region,
        formatUsd(row.revenue),
        row.vatRate > 0 ? formatPercent(row.vatRate) : '—',
        row.vatRate > 0 ? formatUsd(row.vatAmount) : '—',
      ],
      y,
      { bgColor: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB' },
    );
    doc.y = y;
  }

  // Totals row
  y = ensureSpace(doc, 24, () => doc.addPage());
  y += 2;
  drawLine(doc, PAGE_MARGIN, y, PAGE_MARGIN + CONTENT_WIDTH, TEXT_PRIMARY, 1);
  y = drawTableRow(doc, summaryColumns, ['TOTAL', formatUsd(totalRevenue), '', formatUsd(totalVat)], y + 2, {
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
    y = ensureSpace(doc, 18, () => doc.addPage());

    // Re-draw header after page break
    if (y === PAGE_MARGIN) {
      drawAccentBar(doc);
      y = drawTableHeaderRow(doc, txColumns, y + 10);
    }

    const txHash = record.feeTransactionHash ? `${record.feeTransactionHash.slice(0, 22)}...` : '—';
    const chainName = getChainName(record.chainId);
    const explorerUrl = getChainExplorerUrl(record.chainId as DocumentedChainId);
    const txUrl = record.feeTransactionHash ? `${explorerUrl}/tx/${record.feeTransactionHash}` : null;
    const region = record.vatRegion?.trim().toUpperCase() ?? '—';
    const vatRate = EU_VAT_RATES[region]?.rate ?? 0;
    const vatAmount = Math.round((record.feePaid * vatRate) / (1 + vatRate));
    const vatLabel = vatRate > 0 ? `${formatUsd(vatAmount)} (${formatPercent(vatRate)})` : '';

    y = drawTableRow(
      doc,
      txColumns,
      [formatDate(record.timestamp), chainName, txHash, region, formatUsd(record.feePaid), vatLabel],
      y,
      {
        bgColor: i % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
        link: txUrl ? { colIndex: 2, url: txUrl } : undefined,
      },
    );
    doc.y = y;
  }

  // Draw page footers on all buffered pages
  const { start, count: totalPages } = doc.bufferedPageRange();
  for (let i = start; i < start + totalPages; i++) {
    doc.switchToPage(i);
    const savedBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(TEXT_SECONDARY)
      .text(`Revoke.cash — Page ${i + 1}/${totalPages}`, PAGE_MARGIN, PAGE_HEIGHT - 30, {
        width: CONTENT_WIDTH,
        align: 'center',
        lineBreak: false,
      });
    doc.page.margins.bottom = savedBottomMargin;
  }

  doc.end();

  return new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
};

// --- PDF Drawing Helpers ---

const drawAccentBar = (doc: PDFKit.PDFDocument) => {
  doc.rect(0, 0, PAGE_WIDTH, 6).fill(ACCENT_COLOR);
};

const drawLine = (doc: PDFKit.PDFDocument, x1: number, y: number, x2: number, color: string, width = 0.5) => {
  doc.strokeColor(color).lineWidth(width).moveTo(x1, y).lineTo(x2, y).stroke();
};

const ensureSpace = (doc: PDFKit.PDFDocument, needed: number, onPageBreak?: () => void): number => {
  const pageBottom = PAGE_HEIGHT - PAGE_MARGIN - 15; // Reserve space for footer
  if (doc.y + needed > pageBottom) {
    if (onPageBreak) {
      onPageBreak();
    } else {
      doc.addPage();
    }
    return PAGE_MARGIN;
  }
  return doc.y;
};

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
  const headerY = PAGE_MARGIN;

  // Accent bar at top
  drawAccentBar(doc);

  // Logo
  const logoPath = path.join(process.cwd(), 'public/assets/images/revoke-icon-orange-black.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, PAGE_MARGIN, headerY + 4, { width: 30, height: 30 });
  }

  // Company name (offset for logo)
  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor(TEXT_PRIMARY)
    .text('Revoke.cash', PAGE_MARGIN + 36, headerY + 10);

  // Company info (right side)
  const rightBlockX = PAGE_MARGIN + 300;
  const rightBlockWidth = CONTENT_WIDTH - 300;

  const companyInfo = process.env.INVOICE_COMPANY_INFO;
  if (companyInfo) {
    const lines = companyInfo.split('\\n');
    doc.font('Helvetica-Bold').fontSize(8).fillColor(TEXT_PRIMARY);
    doc.text(lines[0], rightBlockX, headerY + 10, { width: rightBlockWidth, align: 'right' });
    doc.font('Helvetica').fontSize(8).fillColor(TEXT_SECONDARY);
    for (let i = 1; i < lines.length; i++) {
      doc.text(lines[i], rightBlockX, headerY + 10 + i * 11, { width: rightBlockWidth, align: 'right' });
    }
  }

  // Title
  const titleY = companyInfo ? headerY + 10 + companyInfo.split('\\n').length * 11 + 6 : headerY + 42;
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
  doc.text(formatUsd(totalRevenue), rightCol + 90, infoY + 22);

  // Divider
  drawLine(doc, PAGE_MARGIN, infoY + 44, PAGE_MARGIN + CONTENT_WIDTH, BORDER_COLOR, 1);

  doc.y = infoY + 58;
};

const drawSectionTitle = (doc: PDFKit.PDFDocument, title: string) => {
  doc.font('Helvetica-Bold').fontSize(12).fillColor(TEXT_PRIMARY).text(title);
  doc.moveDown(0.4);
};
