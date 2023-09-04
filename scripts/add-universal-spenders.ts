import fs from 'fs/promises';
import { CHAIN_SELECT_MAINNETS } from 'lib/utils/chains';
import path from 'path';
import { getAddress } from 'viem';

// Universal Spenders should be added to every mainnet chain (e.g. Permit2)
const UNIVERSAL_SPENDERS = {
  '0x000000000022D473030F116dDEE9F6B43aC78BA3': {
    name: 'Permit2',
    label: 'Permit2',
  },
};

const SPENDERS_BASE_PATH = path.join(__dirname, '..', 'data', 'spenders');

CHAIN_SELECT_MAINNETS.forEach((chainId) => {
  Object.entries(UNIVERSAL_SPENDERS).forEach(async ([address, spender]) => {
    const chainPath = path.join(SPENDERS_BASE_PATH, `${chainId}`);
    await fs.mkdir(chainPath, { recursive: true });

    const spenderPath = path.join(chainPath, `${getAddress(address)}.json`);
    const spenderJson = JSON.stringify(spender, null, 2);
    await fs.writeFile(spenderPath, spenderJson);
  });
});
