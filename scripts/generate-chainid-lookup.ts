import { allChains, getChain } from '@revoke.cash/chains';
import { writeFileSync } from 'fs';
import { getChainName } from 'lib/utils/chains';
import { join } from 'path';

const lookupName = (chainId: number) => {
  try {
    return getChainName(chainId);
  } catch {
    return getChain(chainId)?.name;
  }
};

const path = join(__dirname, 'data', `chainid-lookup-${new Date().toISOString().split('T')[0]}.csv`);
const lookupCsvValues = Object.keys(allChains())
  .map((chainId) => `${chainId},${lookupName(Number(chainId))}`)
  .join('\n');
const lookupCsvHeader = 'chainId,chainName';
const lookupCsv = `${lookupCsvHeader}\n${lookupCsvValues}`;
writeFileSync(path, lookupCsv);
