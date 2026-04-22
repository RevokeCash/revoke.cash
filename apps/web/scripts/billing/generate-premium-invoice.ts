import fs from 'node:fs';
import path from 'node:path';
import { generatePdf } from './pdf';
import { buildVatSummary, fetchPremiumFeeRecords, formatUsd, parseDateRangeArgs } from './utils';

const main = async () => {
  const { from, to } = parseDateRangeArgs(process.argv.slice(2));

  console.log(
    `Fetching premium fee records from ${from.toISOString().slice(0, 10)} to ${to.toISOString().slice(0, 10)}...`,
  );

  const records = await fetchPremiumFeeRecords(from, to);
  console.log(`Found ${records.length} confirmed premium payments.`);

  if (records.length === 0) {
    console.log('No records found. Exiting.');
    process.exit(0);
  }

  const totalRevenue = records.reduce((sum, r) => sum + r.feePaid, 0);
  console.log(`Total revenue: ${formatUsd(totalRevenue)}`);

  const summary = buildVatSummary(records);

  const outputDir = path.join(process.cwd(), 'scripts', 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);
  const outputPath = path.join(outputDir, `premium-invoice-${fromStr}-to-${toStr}.pdf`);

  console.log(`Generating PDF: ${outputPath}`);
  await generatePdf({
    title: 'Revoke Premium Payments',
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
