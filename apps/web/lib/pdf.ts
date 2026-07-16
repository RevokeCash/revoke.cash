import fs from 'node:fs';
import path from 'node:path';

// Shared pdfkit design language for generated documents (invoices, refund confirmations)

export const ACCENT_COLOR = '#fdb952'; // Revoke brand orange
export const ACCENT_LIGHT = '#FEF7EC'; // Light orange tint
export const TEXT_PRIMARY = '#111827'; // Gray-900
export const TEXT_SECONDARY = '#6B7280'; // Gray-500
export const BORDER_COLOR = '#E5E7EB'; // Gray-200
export const PAGE_MARGIN = 50;
export const PAGE_WIDTH = 595.28; // A4
export const PAGE_HEIGHT = 841.89; // A4
export const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

export const drawAccentBar = (doc: PDFKit.PDFDocument) => {
  doc.rect(0, 0, PAGE_WIDTH, 6).fill(ACCENT_COLOR);
};

export const drawLine = (doc: PDFKit.PDFDocument, x1: number, y: number, x2: number, color: string, width = 0.5) => {
  doc.strokeColor(color).lineWidth(width).moveTo(x1, y).lineTo(x2, y).stroke();
};

export const ensureSpace = (doc: PDFKit.PDFDocument, needed: number): number => {
  const pageBottom = PAGE_HEIGHT - PAGE_MARGIN - 15; // Reserve space for footer
  if (doc.y + needed > pageBottom) {
    doc.addPage();
    return PAGE_MARGIN;
  }
  return doc.y;
};

export const drawSectionTitle = (doc: PDFKit.PDFDocument, title: string) => {
  doc.font('Helvetica-Bold').fontSize(12).fillColor(TEXT_PRIMARY).text(title);
  doc.moveDown(0.4);
};

// Accent bar, logo, company name, and optionally the INVOICE_COMPANY_INFO block; returns the y below the header
export const drawBrandHeader = (doc: PDFKit.PDFDocument, includeCompanyInfo = true): number => {
  const headerY = PAGE_MARGIN;

  drawAccentBar(doc);

  const logoPath = path.join(process.cwd(), 'public/assets/images/revoke-icon-orange-black.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, PAGE_MARGIN, headerY + 4, { width: 30, height: 30 });
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor(TEXT_PRIMARY)
    .text('Revoke.cash', PAGE_MARGIN + 36, headerY + 10);

  const rightBlockX = PAGE_MARGIN + 300;
  const rightBlockWidth = CONTENT_WIDTH - 300;

  const companyInfo = includeCompanyInfo ? process.env.INVOICE_COMPANY_INFO : undefined;
  if (companyInfo) {
    const lines = companyInfo.split('\\n');
    doc.font('Helvetica-Bold').fontSize(8).fillColor(TEXT_PRIMARY);
    doc.text(lines[0], rightBlockX, headerY + 10, { width: rightBlockWidth, align: 'right' });
    doc.font('Helvetica').fontSize(8).fillColor(TEXT_SECONDARY);
    for (let i = 1; i < lines.length; i++) {
      doc.text(lines[i], rightBlockX, headerY + 10 + i * 11, { width: rightBlockWidth, align: 'right' });
    }
  }

  return companyInfo ? headerY + 10 + companyInfo.split('\\n').length * 11 + 6 : headerY + 42;
};

export const drawPageFooters = (doc: PDFKit.PDFDocument) => {
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
};

export const formatPdfDate = (date: Date): string => {
  return date
    .toISOString()
    .replace('T', ' ')
    .replace(/\.\d{3}Z$/, ' UTC');
};
