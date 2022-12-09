import axios from 'axios';
import { getAddress } from 'ethers/lib/utils';
import fs from 'fs';
import path from 'path';

// Inspired by https://github.com/verynifty/RolodETH/blob/main/sources/reservoir/index.js

const NFT_TOKEN_MAPPING_PATH = path.join(__dirname, '..', 'lib', 'data', 'nft-token-mapping.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const RESERVOIR_API_URL =
  'https://api.reservoir.tools/collections/v5?includeTopBid=false&sortBy=allTimeVolume&limit=20';

const symbolOverrides = {
  '0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258': 'Otherdeeds',
  '0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B': 'CLONE X',
  '0x1A92f7381B9F03921564a437210bB9396471050C': 'Cool Cats',
  '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85': 'ENS Names',
  '0xFaC7BEA255a6990f749363002136aF6556b31e04': 'ENS Names (old)',
};

const fullOverrides = {
  '0x059EDD72Cd353dF5106D2B9cC5ab83a52287aC3a': {
    symbol: 'Art Blocks',
    logoURI: 'https://storage.googleapis.com/subgraph-images/1644278294885Squig.blk.circle.800px.png',
  },
  '0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270': {
    symbol: 'Art Blocks',
    logoURI: 'https://storage.googleapis.com/subgraph-images/1644278294885Squig.blk.circle.800px.png',
  },
  '0xFaC7BEA255a6990f749363002136aF6556b31e04': {
    symbol: 'ENS Names (old)',
    logoURI:
      'https://i.seadn.io/gae/0cOqWoYA7xL9CkUjGlxsjreSYBdrUBE0c6EO1COG4XE8UeP-Z30ckqUNiL872zHQHQU5MUNMNhfDpyXIP17hRSC5HQ?w=500&auto=format',
  },
};

const updateNftTokenlist = async () => {
  if (!fs.existsSync(NFT_TOKEN_MAPPING_PATH)) {
    fs.writeFileSync(NFT_TOKEN_MAPPING_PATH, JSON.stringify({}), {});
  }

  let shouldContinue = true;
  let url = RESERVOIR_API_URL;

  while (shouldContinue) {
    console.log(url);
    const { data } = await axios.get(url);
    const { collections, continuation } = data;

    let currentVolume = Infinity;

    const entries = collections.map((collection) => {
      const { primaryContract, name, image, volume } = collection;
      currentVolume = volume?.allTime;

      if (currentVolume < 100 || !image || !primaryContract || !name) return undefined;

      const address = getAddress(primaryContract);

      if (fullOverrides[address]) {
        return [address, fullOverrides[address]];
      }

      const symbol = symbolOverrides[address] ?? name;

      const nft = {
        symbol,
        logoURI: image.replace('w=500', 'w=32'),
      };

      return [address, nft];
    });

    const mapping = Object.fromEntries(entries.filter((entry) => !!entry));

    // Write to file at every iteration
    const originalMapping = JSON.parse(fs.readFileSync(NFT_TOKEN_MAPPING_PATH, 'utf8'));
    const fullMapping = { '1': { ...originalMapping['1'], ...mapping } };
    fs.writeFileSync(NFT_TOKEN_MAPPING_PATH, JSON.stringify(fullMapping, null, 2));

    // Cut off if we're below a certain volume
    if (continuation && currentVolume > 100) {
      url = `${RESERVOIR_API_URL}&continuation=${continuation}`;
      await sleep(1000);
    } else {
      shouldContinue = false;
    }
  }
};

updateNftTokenlist();
