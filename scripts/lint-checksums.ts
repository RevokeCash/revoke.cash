import { utils } from 'ethers';
import fs from 'fs/promises';
import path from 'path';

const lintChecksums = async (dataPath: string) => {
  const chainIds = await fs.readdir(dataPath);

  await Promise.all(
    chainIds.map(async (chainId) => {
      const chainPath = path.join(dataPath, chainId);
      const files = await fs.readdir(chainPath);

      await Promise.all(
        files.map(async (file) => {
          const address = file.replace('.json', '');
          const checksummedAddress = utils.getAddress(address.toLowerCase());

          await fs.rename(path.join(chainPath, file), path.join(chainPath, `${checksummedAddress}.json`));
        })
      );
    })
  );
};

lintChecksums(path.join(__dirname, '..', 'data', 'spenders'));
lintChecksums(path.join(__dirname, '..', 'data', 'tokens'));
