import { utils } from 'ethers';
import fs from 'fs/promises';
import path from 'path';

const dappListPath = path.join(__dirname, '..', 'public', 'data', 'spenders');

const lintChecksums = async () => {
  const chainIds = await fs.readdir(dappListPath);

  await Promise.all(
    chainIds.map(async (chainId) => {
      const chainPath = path.join(dappListPath, chainId);
      const files = await fs.readdir(chainPath);

      await Promise.all(
        files.map(async (file) => {
          const address = file.replace('.json', '');
          const checksummedAddress = utils.getAddress(address.toLowerCase());
          fs.rename(path.join(chainPath, file), path.join(chainPath, `${checksummedAddress}.json`));
        })
      );
    })
  );
};

lintChecksums();
