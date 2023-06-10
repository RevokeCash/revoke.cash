import axios from 'axios';
import { utils } from 'ethers';
import fs from 'fs/promises';
import path from 'path';
import type { ChainTokenMapping } from '../lib/interfaces';
import { TokenFromList } from '../lib/interfaces';
import { SUPPORTED_CHAINS, getChainName } from '../lib/utils/chains';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const TOKENS_BASE_PATH = path.join(__dirname, '..', 'public', 'data', 'tokens');

const getTokenMapping = async (chainId: number): Promise<ChainTokenMapping | undefined> => {
  const coingeckoMapping = await getTokenMappingFromCoinGecko(chainId);
  const oneInchMapping = await getTokenMappingFrom1inch(chainId);

  if (!coingeckoMapping && !oneInchMapping) {
    return undefined;
  }

  return { ...oneInchMapping, ...coingeckoMapping };
};

const coingeckoChainsPromise = axios.get('https://api.coingecko.com/api/v3/asset_platforms');

const getTokenMappingFromCoinGecko = async (chainId: number): Promise<ChainTokenMapping | undefined> => {
  try {
    const { data: chains } = await coingeckoChainsPromise;
    const coingeckoChainId = chains?.find((chain: any) => chain?.chain_identifier === chainId)?.id;
    if (!coingeckoChainId) return undefined;

    const url = `https://tokens.coingecko.com/${coingeckoChainId}/all.json`;

    const res = await axios.get(url);
    const { tokens } = res.data;

    const tokenMapping = {};
    for (const token of tokens) {
      try {
        tokenMapping[utils.getAddress(token.address)] = token;
      } catch {
        // Ignore invalid addresses
      }
    }

    return tokenMapping;
  } catch (e) {
    console.log('              CoinGecko Error:', e.message);
    return undefined;
  }
};

const getTokenMappingFrom1inch = async (chainId: number): Promise<ChainTokenMapping | undefined> => {
  try {
    const res = await axios.get(`https://tokens.1inch.io/v1.1/${chainId}`);

    const tokenMapping = {};
    for (const token of Object.values<any>(res.data)) {
      tokenMapping[utils.getAddress(token.address)] = token;
    }

    return tokenMapping as ChainTokenMapping;
  } catch (e) {
    if (!e?.response?.data?.message?.includes('invalid chain id')) {
      console.log('              1inch Error:', e.message);
    }
    return undefined;
  }
};

// TODO: Update code to merge this with the earlier code
const writeToken = async (token: TokenFromList, address: string, chainId: number) => {
  const chainPath = path.join(TOKENS_BASE_PATH, String(chainId));
  const tokenPath = path.join(chainPath, `${utils.getAddress(address)}.json`);
  await fs.mkdir(chainPath, { recursive: true });
  await fs.writeFile(tokenPath, JSON.stringify(sanitiseToken(token)));
};

const sanitiseToken = (token: TokenFromList) => {
  // Override USDT and WETH logos
  const USDT_LOGO =
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png';
  const WETH_LOGO =
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png';

  const logoOverrides = {
    USDT: USDT_LOGO,
    USDTE: USDT_LOGO,
    WETH: WETH_LOGO,
  };

  return {
    symbol: token.symbol,
    decimals: token.decimals,
    logoURI: logoOverrides[token.symbol] || token.logoURI?.replace('/thumb/', '/small/'),
  };
};

const updateErc20Tokenlist = async () => {
  for (const chainId of SUPPORTED_CHAINS) {
    const mapping = await getTokenMapping(chainId);

    const chainString = `${getChainName(chainId)} (${String(chainId)})`.padEnd(28, ' ');
    if (!mapping) {
      console.log(chainString, 'Not found');
      continue;
    }

    console.log(chainString, `Found ${Object.keys(mapping).length} tokens`);

    await Promise.all(Object.entries(mapping).map(([address, token]) => writeToken(token, address, chainId)));

    // Wait for rate limiting (50/min)
    await sleep(2000);
  }
};

updateErc20Tokenlist();
