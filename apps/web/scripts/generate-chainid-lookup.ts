import { getChainConfig, getChainName } from '@revoke.cash/core/chains';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Writes a chainId,chainName lookup CSV for every chain listed on chainid.network, using our own name where we support the chain
const lookupName = (chainId: number, upstreamName: string) => {
  return getChainConfig(chainId) ? getChainName(chainId) : upstreamName;
};

const generate = async () => {
  const chains: Array<{ chainId: number; name: string }> = await fetch('https://chainid.network/chains.json').then(
    (response) => response.json(),
  );

  const path = join(__dirname, 'output', `chainid-lookup-${new Date().toISOString().split('T')[0]}.csv`);
  const lookupCsvValues = chains
    .sort((left, right) => left.chainId - right.chainId)
    .map((chain) => `${chain.chainId},${lookupName(chain.chainId, chain.name)}`)
    .join('\n');
  const lookupCsvHeader = 'chainId,chainName';
  const lookupCsv = `${lookupCsvHeader}\n${lookupCsvValues}`;
  writeFileSync(path, lookupCsv);
};

generate();
