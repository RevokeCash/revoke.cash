import fs from 'node:fs';
import path from 'node:path';
import { generatePdf } from './pdf';
import { buildVatSummary, fetchBatchRevokeFeeRecords, formatUsd, parseDateRangeArgs } from './utils';

const main = async () => {
  const { from, to } = parseDateRangeArgs(process.argv.slice(2));

  console.log(`Fetching fee records from ${from.toISOString().slice(0, 10)} to ${to.toISOString().slice(0, 10)}...`);

  const records = await fetchBatchRevokeFeeRecords(from, to);
  console.log(`Found ${records.length} paid fee transactions (excl. testnets and sponsored).`);

  if (records.length === 0) {
    console.log('No records found. Exiting.');
    process.exit(0);
  }

  const totalRevenue = records.reduce((sum, r) => sum + r.feeUsdCents, 0);
  console.log(`Total revenue: ${formatUsd(totalRevenue)}`);

  const summary = buildVatSummary(records);

  const outputDir = path.join(process.cwd(), 'scripts', 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);
  const outputPath = path.join(outputDir, `fees-invoice-${fromStr}-to-${toStr}.pdf`);

  console.log(`Generating PDF: ${outputPath}`);
  await generatePdf({
    title: 'Batch Revoke Fees',
    records,
    summary,
    from,
    to,
    outputPath,
  });

  console.log('Done!');
};

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
