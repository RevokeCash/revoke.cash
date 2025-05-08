import { writeFileSync } from 'fs';
import { join } from 'path';
import { allChains, getChain } from '@revoke.cash/chains';
import { getChainName } from 'lib/utils/chains';

const lookupName = (chainId: number) => {
  try {
    return getChainName(chainId);
  } catch (error) {
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
