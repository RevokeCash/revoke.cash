import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import type { ChainTokenMapping } from '../lib/interfaces';
import { TokenFromList } from '../lib/interfaces';
import {
  CHAIN_SELECT_MAINNETS,
  CHAIN_SELECT_TESTNETS,
  ORDERED_CHAINS,
  SUPPORTED_CHAINS,
  getChainName,
} from '../lib/utils/chains';
import { getAddress, isAddress } from 'viem';
import { ChainId } from '@revoke.cash/chains';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const TOKENS_BASE_PATH = path.join(__dirname, '..', 'data', 'tokens');

const getTokenMapping = async (chainId: number): Promise<ChainTokenMapping | undefined> => {
  const tokenlistMapping = await getTokenMappingFromTokenLists(chainId);
  const coingeckoMapping = await getTokenMappingFromCoinGecko(chainId);
  const oneInchMapping = await getTokenMappingFrom1inch(chainId);

  if (!coingeckoMapping && !oneInchMapping && !tokenlistMapping) {
    return undefined;
  }

  return { ...tokenlistMapping, ...oneInchMapping, ...coingeckoMapping };
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
      if (!isAddress(token.address)) continue;
      tokenMapping[getAddress(token.address)] = token;
    }

    return tokenMapping;
  } catch (e) {
    console.log('              CoinGecko Error:', e.message);
    return undefined;
  }
};

const getTokenMappingFrom1inch = async (chainId: number): Promise<ChainTokenMapping | undefined> => {
  try {
    const res = await axios.get(`https://tokens.1inch.io/v1.2/${chainId}`);

    const tokenMapping = {};
    for (const token of Object.values<any>(res.data)) {
      if (!isAddress(token.address)) continue;
      tokenMapping[getAddress(token.address)] = token;
    }

    return tokenMapping as ChainTokenMapping;
  } catch (e) {
    if (!e?.response?.data?.message?.includes('invalid chain id')) {
      console.log('              1inch Error:', e.message);
    }
    return undefined;
  }
};

const getTokenList = async (url: string, chainId?: number) => {
  if (url.startsWith('/')) {
    url = `https://raw.githubusercontent.com${url}`;
  }

  const res = await axios.get(url);

  if (res.data.tokens) {
    return res.data.tokens.map((token: any) => ({ ...token, chainId: chainId ?? token.chainId }));
  }

  return [];
};

// Could get some tokens from:
// - https://github.com/curvefi/curve-assets/tree/main/images
// - https://github.com/kardiachain/token-assets/tree/master

const tokenlistPromise = Promise.all([
  getTokenList('/map3xyz/wanchain-tokenlist/master/tokenlist.json', ChainId.Wanchain),
  getTokenList('/kardiachain/token-assets/master/tokens/mobile-list.json', ChainId.KardiaChainMainnet),
  getTokenList(
    '/yodedex/yodeswap-default-tokenlist/696cafc9a9cba70e6617ec3439cd7ef76d2052dd/yodeswap.tokenlist.json',
    ChainId.DogechainMainnet,
  ),
  getTokenList('/CoinTool-App/cdn/d5f27f04269a0ccc1d9252510ed699b80744f3c8/json/dogechain.json'),
  getTokenList('/CoinTool-App/cdn/d5f27f04269a0ccc1d9252510ed699b80744f3c8/json/heco.json'),
  getTokenList('/CoinTool-App/cdn/d5f27f04269a0ccc1d9252510ed699b80744f3c8/json/movr.json'),
  getTokenList('/CoinTool-App/cdn/d5f27f04269a0ccc1d9252510ed699b80744f3c8/json/onus.json'),
  getTokenList('/BeamSwap/exosama-tokenlist/main/tokenlist.json'),
  getTokenList('https://unpkg.com/@1hive/default-token-list@5.17.1/build/honeyswap-default.tokenlist.json'),
  getTokenList('https://unpkg.com/quickswap-default-token-list@1.0.91/build/quickswap-default.tokenlist.json'),
  getTokenList('/Ubeswap/default-token-list/master/ubeswap.token-list.json'),
  getTokenList('/DefiKingdoms/community-token-list/main/src/defikingdoms-default.tokenlist.json'),
  getTokenList('/syscoin/syscoin-rollux.github.io/c7a99fa23f7d51b6afc3f2683e999b3e51532c22/rollux.tokenlist.json'),
  getTokenList('/nahmii-community/bridge/4ae719bcac44377952f6a18710d619821d772459/src/nahmii.tokenlist.json'),
  getTokenList(
    '/etherspot/etherspot-popular-tokens-tokenlist/ceb93ecae050b100069d912339307c8acf63153a/multichain.tokenlist.json',
  ),
  getTokenList('/elkfinance/tokens/c205c0d68a8a2d0052c17207d5440ac934b150fa/all.tokenlist.json'),
  axios
    .get('https://raw.githubusercontent.com/viaprotocol/tokenlists/main/all_tokens/all.json')
    .then((res) => Object.values(res.data).flat()),
  getTokenList('/pangolindex/tokenlists/main/pangolin.tokenlist.json'),
  getTokenList('https://static.optimism.io/optimism.tokenlist.json'),
  getTokenList('https://tokens.uniswap.org'),
]).then((lists) => lists.flat());

const getTokenMappingFromTokenLists = async (chainId: number): Promise<ChainTokenMapping | undefined> => {
  try {
    const tokens = await tokenlistPromise;

    const tokenMapping = {};
    for (const token of Object.values<any>(tokens)) {
      if (token.chainId !== chainId) continue;
      if (!isAddress(token.address)) continue;

      // I don't know why, but KardiaChain decided they could just use completely different terms for their tokenlist -_-
      tokenMapping[getAddress(token.address)] = {
        ...token,
        symbol: token.symbol ?? token.tokenSymbol,
        decimals: token.decimals ?? token.decimal,
        logoURI: token.logoURI ?? token.logo,
      };
    }

    if (Object.keys(tokenMapping).length === 0) return undefined;

    return tokenMapping as ChainTokenMapping;
  } catch (e) {
    console.log('              TokenList Error:', e.message);
    return undefined;
  }
};

// TODO: Update code to merge this with the earlier code
const writeToken = async (token: TokenFromList, address: string, chainId: number) => {
  // For some reason some tokenlists have 0x0 as a token
  if (address === '0x0000000000000000000000000000000000000000') return;
  if (!token.logoURI || !token.symbol) return;

  const chainPath = path.join(TOKENS_BASE_PATH, String(chainId));
  const tokenPath = path.join(chainPath, `${getAddress(address)}.json`);
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
  for (const chainId of ORDERED_CHAINS) {
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
