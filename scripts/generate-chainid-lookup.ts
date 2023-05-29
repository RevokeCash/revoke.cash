import { chains } from '@revoke.cash/chains';
import { writeFileSync } from 'fs';
import { getChainName } from 'lib/utils/chains';
import { join } from 'path';

const path = join(__dirname, 'chainid-lookup.csv');
const lookupCsvValues = Object.keys(chains.all())
  .map((chainId) => `${chainId},${getChainName(Number(chainId))}`)
  .join('\n');
const lookupCsvHeader = 'chainId,chainName';
const lookupCsv = `${lookupCsvHeader}\n${lookupCsvValues}`;
writeFileSync(path, lookupCsv);
