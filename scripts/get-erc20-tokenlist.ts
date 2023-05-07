import axios from 'axios';
import { utils } from 'ethers';
import fs from 'fs';
import path from 'path';
import type { ChainTokenMapping } from '../lib/interfaces';
import { SUPPORTED_CHAINS } from '../lib/utils/chains';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const TOKEN_MAPPING_PATH = path.join(__dirname, '..', 'lib', 'data', 'erc20-token-mapping.json');

const getTokenMapping = async (chainId: number): Promise<ChainTokenMapping | undefined> => {
  const coingeckoMapping = await getTokenMappingFromCoinGecko(chainId);
  const oneInchMapping = await getTokenMappingFrom1inch(chainId);

  if (!coingeckoMapping && !oneInchMapping) {
    return undefined;
  }

  return applyOverrides({ ...oneInchMapping, ...coingeckoMapping });
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

    const tokenMapping: ChainTokenMapping = {};
    for (const token of tokens) {
      try {
        tokenMapping[utils.getAddress(token.address)] = {
          symbol: token.symbol,
          decimals: token.decimals,
          logoURI: token.logoURI?.replace('/thumb/', '/small/'),
        };
      } catch {
        // Ignore invalid addresses
      }
    }

    return tokenMapping;
  } catch (e: any) {
    console.log('              CoinGecko Error:', e.message);
    return undefined;
  }
};

const getTokenMappingFrom1inch = async (chainId: number): Promise<ChainTokenMapping | undefined> => {
  try {
    const res = await axios.get(`https://tokens.1inch.io/v1.1/${chainId}`);

    const tokenMapping: ChainTokenMapping = {};
    for (const token of Object.values<any>(res.data)) {
      tokenMapping[utils.getAddress(token.address)] = {
        symbol: token.symbol,
        decimals: token.decimals,
        logoURI: token.logoURI,
      };
    }

    return tokenMapping as ChainTokenMapping;
  } catch (e: any) {
    // 404 and 500 errors are expected when the chain is not supported
    if (!e?.message?.includes('404') && !e?.message?.includes('500')) {
      console.log('              1inch Error:', e.message);
    }
    return undefined;
  }
};

const applyOverrides = (tokenMapping: ChainTokenMapping) => {
  // Override USDT and WETH logos
  const USDT_LOGO =
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png';
  const WETH_LOGO =
    'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png';

  return Object.fromEntries(
    Object.entries(tokenMapping).map(([address, token]) => {
      if (token.symbol === 'USDT') return [address, { ...token, logoURI: USDT_LOGO }];
      if (token.symbol === 'USDTE') return [address, { ...token, logoURI: USDT_LOGO }];
      if (token.symbol === 'WETH') return [address, { ...token, logoURI: WETH_LOGO }];
      return [address, token];
    })
  );
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

    // Wait for rate limiting (50/min)
    await sleep(2000);
  }
};

updateErc20Tokenlist();
