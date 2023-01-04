import axios from 'axios';
import dotenv from 'dotenv';
import { getAddress } from 'ethers/lib/utils';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SPAM_TOKENS_PATH = path.join(__dirname, '..', 'lib', 'data', 'spam-tokens.json');

const updateSpamTokens = async () => {
  if (!fs.existsSync(SPAM_TOKENS_PATH)) {
    fs.writeFileSync(SPAM_TOKENS_PATH, JSON.stringify([]), {});
  }

  const urls = [
    `https://eth-mainnet.g.alchemy.com/nft/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}/getSpamContracts`,
    `https://polygon-mainnet.g.alchemy.com/nft/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}/getSpamContracts`,
  ];

  const results = await Promise.all(
    urls.map(async (url) => {
      const { data } = await axios.get(url);
      return data;
    })
  );

  const originalList = JSON.parse(fs.readFileSync(SPAM_TOKENS_PATH, 'utf8'));
  const fullList = Array.from(new Set([...originalList, ...results.flat().map(getAddress)]));
  fs.writeFileSync(SPAM_TOKENS_PATH, JSON.stringify(fullList, null, 2));
};

updateSpamTokens();
