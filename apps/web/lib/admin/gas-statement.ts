import { EXECUTOR_WALLETS } from '@revoke.cash/core/admin/executor';
import type { GasSpendReport } from '@revoke.cash/core/admin/gas-spend';
import { buildGasDepositSummary, type GasDeposit, type GasWalletReport } from '@revoke.cash/core/admin/gas-wallets';
import type { ExecutionLane } from '@revoke.cash/core/auto-revoke/execution/signer';
import { getChainExplorerUrl, getChainName } from '@revoke.cash/core/chains';
import { formatFiatAmount, formatUsdCents, shortenAddress } from '@revoke.cash/core/utils/formatting';
import { formatNativeAmount, formatUsd } from 'lib/admin/format';
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
  formatPeriodLabel,
  PAGE_MARGIN,
  type PdfTableColumn,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from 'lib/pdf';
import PDFDocument from 'pdfkit';

const LANE_LABELS: Record<ExecutionLane, string> = { normal: 'Normal', urgent: 'Urgent' };

interface GenerateGasStatementPdfOptions {
  walletReport: GasWalletReport;
  spendReport: GasSpendReport;
  from: Date;
  to: Date;
}

export const generateGasStatementPdf = ({
  walletReport,
  spendReport,
  from,
  to,
}: GenerateGasStatementPdfOptions): Promise<Buffer> => {
  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const depositSummary = buildGasDepositSummary(walletReport.deposits);
  const totalDepositedUsdCents = depositSummary.reduce((sum, row) => sum + row.valueUsdCents, 0);

  // --- Page 1: Header + summaries per chain ---
  drawDocumentHeader(
    doc,
    'Auto-Revoke Gas Statement',
    [
      { label: 'Period', value: formatPeriodLabel(from, to) },
      { label: 'Generated', value: new Date().toISOString().slice(0, 10) },
    ],
    [
      { label: 'Total Deposited', value: formatUsdCents(totalDepositedUsdCents) },
      { label: 'Gas Spent', value: formatUsd(spendReport.spendUsd) },
    ],
  );

  drawDescription(doc);

  drawSummaryTable(
    doc,
    'Wallet Balances by Chain',
    [
      { label: 'Chain', x: PAGE_MARGIN, width: 70 },
      { label: 'Opening', x: PAGE_MARGIN + 70, width: 90, align: 'right' },
      { label: 'Deposits', x: PAGE_MARGIN + 160, width: 90, align: 'right' },
      { label: 'Spent', x: PAGE_MARGIN + 250, width: 90, align: 'right' },
      { label: 'Closing', x: PAGE_MARGIN + 340, width: 90, align: 'right' },
      { label: 'Value (USD)', x: PAGE_MARGIN + 430, width: 65, align: 'right' },
    ],
    walletReport.balances.map((balance) => [
      getChainName(balance.chainId),
      formatNativeAmount(BigInt(balance.openingBalanceWei), balance.nativeToken),
      formatNativeAmount(BigInt(balance.depositedWei), balance.nativeToken),
      formatNativeAmount(BigInt(balance.spentWei), balance.nativeToken),
      formatNativeAmount(BigInt(balance.closingBalanceWei), balance.nativeToken),
      formatUsd(balance.closingValueUsd),
    ]),
    [
      'TOTAL',
      '',
      '',
      '',
      '',
      formatUsd(walletReport.balances.reduce((sum, balance) => sum + balance.closingValueUsd, 0)),
    ],
  );

  drawSummaryTable(
    doc,
    'Recorded Gas Spend by Chain',
    [
      { label: 'Chain', x: PAGE_MARGIN, width: 150 },
      { label: 'Transactions', x: PAGE_MARGIN + 150, width: 80, align: 'right' },
      { label: 'Spend (USD)', x: PAGE_MARGIN + 230, width: 90, align: 'right' },
      { label: 'Per Transaction', x: PAGE_MARGIN + 320, width: 90, align: 'right' },
      { label: 'Failed (USD)', x: PAGE_MARGIN + 410, width: 85, align: 'right' },
    ],
    spendReport.chains.map((chain) => [
      getChainName(chain.chainId),
      chain.actionCount.toLocaleString(),
      formatUsd(chain.spendUsd),
      formatUsd(chain.spendUsd / chain.actionCount),
      formatUsd(chain.failedSpendUsd),
    ]),
    [
      'TOTAL',
      spendReport.actionCount.toLocaleString(),
      formatUsd(spendReport.spendUsd),
      spendReport.actionCount > 0 ? formatUsd(spendReport.spendUsd / spendReport.actionCount) : '',
      formatUsd(spendReport.failedSpendUsd),
    ],
  );

  drawSummaryTable(
    doc,
    'Deposits by Chain',
    [
      { label: 'Chain', x: PAGE_MARGIN, width: 190 },
      { label: 'Deposits', x: PAGE_MARGIN + 190, width: 100, align: 'right' },
      { label: 'Amount', x: PAGE_MARGIN + 290, width: 120, align: 'right' },
      { label: 'Value (USD)', x: PAGE_MARGIN + 410, width: 85, align: 'right' },
    ],
    depositSummary.map((row) => [
      getChainName(row.chainId),
      row.depositCount.toLocaleString(),
      formatNativeAmount(BigInt(row.amountWei), row.nativeToken),
      formatUsdCents(row.valueUsdCents),
    ]),
    ['TOTAL', walletReport.deposits.length.toLocaleString(), '', formatUsdCents(totalDepositedUsdCents)],
  );

  // --- Next page: Deposit Details ---
  drawDepositDetails(doc, walletReport.deposits);

  drawPageFooters(doc);

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
};

const drawDescription = (doc: PDFKit.PDFDocument) => {
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(TEXT_PRIMARY)
    .text(
      'Native token flows of the auto-revoke executor wallets, which pay the gas for auto-revoke transactions. ' +
        'Spent is the opening balance plus deposits minus the closing balance, so it contains all gas that the wallets paid. ' +
        'Recorded gas spend is the cost of each auto-revoke transaction at the price when it settled. ' +
        'Deposits are valued at the CoinGecko USD price closest to the time of the deposit.',
      PAGE_MARGIN,
      doc.y,
      { width: CONTENT_WIDTH },
    );

  const walletsY = doc.y + 8;
  EXECUTOR_WALLETS.forEach(({ lane, address }, index) => {
    const rowY = walletsY + index * 14;
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(TEXT_SECONDARY)
      .text(`${LANE_LABELS[lane]} lane wallet`, PAGE_MARGIN, rowY);
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(TEXT_PRIMARY)
      .text(address, PAGE_MARGIN + 100, rowY);
  });

  doc.x = PAGE_MARGIN;
  doc.y = walletsY + EXECUTOR_WALLETS.length * 14 + 12;
};

// Summary tables have one row per chain at most, so each table moves to a new page as a whole when it does not fit
const drawSummaryTable = (
  doc: PDFKit.PDFDocument,
  title: string,
  columns: PdfTableColumn[],
  rows: string[][],
  totals: string[],
) => {
  const tableHeight = 30 + 20 + (rows.length + 1) * 18 + 4;
  if (ensureSpace(doc, tableHeight) === PAGE_MARGIN) {
    drawAccentBar(doc);
    doc.y = PAGE_MARGIN + 10;
  }

  drawSectionTitle(doc, title);

  const rowsEndY = rows.reduce(
    (y, values, index) => drawTableRow(doc, columns, values, y, { bgColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }),
    drawTableHeaderRow(doc, columns, doc.y),
  );

  drawLine(doc, PAGE_MARGIN, rowsEndY + 2, PAGE_MARGIN + CONTENT_WIDTH, TEXT_PRIMARY, 1);
  const totalsEndY = drawTableRow(doc, columns, totals, rowsEndY + 4, { bold: true, bgColor: ACCENT_LIGHT });

  doc.x = PAGE_MARGIN;
  doc.y = totalsEndY + 20;
};

const drawDepositDetails = (doc: PDFKit.PDFDocument, deposits: GasDeposit[]) => {
  doc.addPage();
  drawAccentBar(doc);
  doc.y = PAGE_MARGIN + 10;
  drawSectionTitle(doc, 'Deposit Details');

  const columns: PdfTableColumn[] = [
    { label: 'Date (UTC)', x: PAGE_MARGIN, width: 82 },
    { label: 'Chain', x: PAGE_MARGIN + 82, width: 68 },
    { label: 'Wallet', x: PAGE_MARGIN + 150, width: 45 },
    { label: 'Transaction Hash', x: PAGE_MARGIN + 195, width: 90 },
    { label: 'Amount', x: PAGE_MARGIN + 285, width: 95, align: 'right' },
    { label: 'Price', x: PAGE_MARGIN + 380, width: 55, align: 'right' },
    { label: 'Value (USD)', x: PAGE_MARGIN + 435, width: 60, align: 'right' },
  ];

  let y = drawTableHeaderRow(doc, columns, doc.y);

  deposits.forEach((deposit, index) => {
    y = ensureSpace(doc, 18);

    // Re-draw header after page break
    if (y === PAGE_MARGIN) {
      drawAccentBar(doc);
      y = drawTableHeaderRow(doc, columns, y + 10);
    }

    const transactionUrl = `${getChainExplorerUrl(deposit.chainId)}/tx/${deposit.transactionHash}`;

    y = drawTableRow(
      doc,
      columns,
      [
        deposit.timestamp.toISOString().slice(0, 16).replace('T', ' '),
        getChainName(deposit.chainId),
        LANE_LABELS[deposit.lane],
        shortenAddress(deposit.transactionHash, 6),
        formatNativeAmount(deposit.amountWei, deposit.nativeToken),
        formatFiatAmount(deposit.priceUsd, deposit.priceUsd < 1 ? 4 : 2) ?? '',
        formatUsdCents(deposit.valueUsdCents),
      ],
      y,
      {
        bgColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB',
        link: { colIndex: 3, url: transactionUrl },
      },
    );
    doc.y = y;
  });
};
