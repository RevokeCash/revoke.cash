import { ChainId } from '@revoke.cash/chains';
import axios from 'axios';
import dotenv from 'dotenv';
import { writeFile } from 'fs/promises';
import { ALCHEMY_API_KEY } from 'lib/constants';
import path from 'path';
import { getAddress } from 'viem';

dotenv.config();

const TOKENS_BASE_PATH = path.join(__dirname, '..', 'data', 'tokens');

const updateSpamTokens = async () => {
  const chains = [ChainId.EthereumMainnet, ChainId.PolygonMainnet];
  for (const chainId of chains) {
    await updateSpamTokensForChain(chainId);
  }
};

const updateSpamTokensForChain = async (chainId: number) => {
  const urls = {
    [ChainId.EthereumMainnet]: `https://eth-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getSpamContracts`,
    [ChainId.PolygonMainnet]: `https://polygon-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_API_KEY}/getSpamContracts`,
  };

  const { data: spamTokens } = await axios.get(urls[chainId]);

  await Promise.all(spamTokens.map((address) => writeToken(chainId, address)));
};

const writeToken = async (chainId: number, address: string) => {
  const tokenPath = path.join(TOKENS_BASE_PATH, String(chainId), `${getAddress(address)}.json`);
  const token = { isSpam: true };

  try {
    await writeFile(tokenPath, JSON.stringify(token));
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await writeToken(chainId, address);
  }
};

updateSpamTokens();
