import axios from 'axios';
import { ChainId } from 'eth-chains';
import { utils } from 'ethers';
import fs from 'fs';
import { ChainTokenMapping } from 'lib/interfaces';
import path from 'path';
import { SUPPORTED_CHAINS } from '../lib/utils/chains';

const TOKEN_MAPPING_PATH = path.join(__dirname, '..', 'lib', 'data', 'erc20-token-mapping.json');

const tokenlistUrls = {
  [ChainId.HarmonyMainnetShard0]:
    'https://raw.githubusercontent.com/DefiKingdoms/community-token-list/main/src/defikingdoms-default.tokenlist.json',
  [ChainId.MetisAndromedaMainnet]:
    'https://raw.githubusercontent.com/MetisProtocol/metis/master/tokenlist/toptoken.json',
};

const getTokenMapping = async (chainId: number): Promise<ChainTokenMapping | undefined> => {
  const url = tokenlistUrls[chainId];

  try {
    const res = await axios.get(url);
    const { tokens } = res.data;

    const tokenMapping = {};
    for (const token of tokens) {
      tokenMapping[utils.getAddress(token.address)] = {
        symbol: token.symbol,
        decimals: token.decimals,
        logoURI: token.logoURI,
      };
    }

    return tokenMapping;
  } catch {
    // Fallback to 1inch token mapping
    return getTokenMappingFrom1inch(chainId);
  }
};

const getTokenMappingFrom1inch = async (chainId: number): Promise<ChainTokenMapping | undefined> => {
  try {
    const res = await axios.get(`https://tokens.1inch.io/v1.1/${chainId}`);

    const tokenMapping = {};
    for (const token of Object.values<any>(res.data)) {
      tokenMapping[utils.getAddress(token.address)] = {
        symbol: token.symbol,
        decimals: token.decimals,
        logoURI: token.logoURI,
      };
    }

    return tokenMapping as ChainTokenMapping;
  } catch {
    return undefined;
  }
};

const updateErc20Tokenlist = async () => {
  if (!fs.existsSync(TOKEN_MAPPING_PATH)) {
    fs.writeFileSync(TOKEN_MAPPING_PATH, JSON.stringify({}), {});
  }

  for (const chainId of SUPPORTED_CHAINS) {
    const mapping = await getTokenMapping(chainId);

    if (!mapping) {
      console.log('Chain', String(chainId).padEnd(12, ' '), 'Not found');
      continue;
    }

    console.log('Chain', String(chainId).padEnd(12, ' '), `Found ${Object.keys(mapping).length} tokens`);

    // Write to file at every iteration
    const originalMapping = JSON.parse(fs.readFileSync(TOKEN_MAPPING_PATH, 'utf8'));
    const fullMapping = { ...originalMapping, [chainId]: { ...originalMapping[chainId], ...mapping } };
    fs.writeFileSync(TOKEN_MAPPING_PATH, JSON.stringify(fullMapping, null, 2));
  }
};

updateErc20Tokenlist();
