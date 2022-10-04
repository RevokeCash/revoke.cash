import axios from 'axios';
import { ChainId } from 'eth-chains';
import { getAddress } from 'ethers/lib/utils';
import { TRUSTWALLET_BASE_URL } from 'lib/constants';
import { Erc20TokenData, Erc721TokenData, TokenFromList, TokenMapping, TokenStandard } from 'lib/interfaces';
import { getChainTrustWalletName } from './chains';

// Check if a token is verified in the token mapping
export function isVerifiedToken(tokenAddress: string, tokenMapping?: TokenMapping): boolean {
  // If we don't know a verified token mapping, we skip checking verification
  if (!tokenMapping) return true;
  return tokenMapping[getAddress(tokenAddress)] !== undefined;
}

export const isSpamToken = (token: Erc20TokenData | Erc721TokenData) => {
  const includesHttp = /https?:\/\//i.test(token.symbol);
  // This is not exhaustive, but we can add more TLDs to the list as needed, better than nothing
  const includesTld =
    /\.com|\.io|\.xyz|\.org|\.me|\.site|\.net|\.fi|\.vision|\.team|\.app|\.exchange|\.cash|\.finance/i.test(
      token.symbol
    );
  return includesHttp || includesTld;
};

export async function getFullTokenMapping(chainId: number): Promise<TokenMapping | undefined> {
  if (!chainId) return undefined;

  const erc20Mapping = await getTokenMapping(chainId, 'ERC20');
  const erc721Mapping = await getTokenMapping(chainId, 'ERC721');

  if (erc20Mapping === undefined && erc721Mapping === undefined) return undefined;

  const fullMapping = { ...erc721Mapping, ...erc20Mapping };
  return fullMapping;
}

async function getTokenMapping(chainId: number, standard: TokenStandard = 'ERC20'): Promise<TokenMapping | undefined> {
  const url = getTokenListUrl(chainId, standard);

  try {
    const res = await axios.get(url);
    const tokens: TokenFromList[] = res.data.tokens;

    const tokenMapping = {};
    for (const token of tokens) {
      tokenMapping[getAddress(token.address)] = token;
    }

    return tokenMapping;
  } catch {
    // Fallback to 1inch token mapping
    return getTokenMappingFrom1inch(chainId);
  }
}

async function getTokenMappingFrom1inch(chainId: number): Promise<TokenMapping | undefined> {
  try {
    const { data: mapping } = await axios.get(`https://tokens.1inch.io/v1.1/${chainId}`);

    const tokenMapping = Object.fromEntries(
      Object.entries(mapping).map(([address, token]) => [getAddress(address), token])
    );

    return tokenMapping as TokenMapping;
  } catch {
    return undefined;
  }
}

function getTokenListUrl(chainId: number, standard: TokenStandard = 'ERC20'): string | undefined {
  const mapping = {
    ERC20: {
      [ChainId.HarmonyMainnetShard0]:
        'https://raw.githubusercontent.com/DefiKingdoms/community-token-list/main/src/defikingdoms-default.tokenlist.json',
      [ChainId.MetisAndromedaMainnet]:
        'https://raw.githubusercontent.com/MetisProtocol/metis/master/tokenlist/toptoken.json',
    },
    ERC721: {
      [ChainId.EthereumMainnet]:
        'https://raw.githubusercontent.com/vasa-develop/nft-tokenlist/master/mainnet_curated_tokens.json',
    },
  };

  return mapping[standard][chainId];
}

export function getTokenIcon(tokenAddress: string, chainId?: number, tokenMapping: TokenMapping = {}) {
  const normalisedAddress = getAddress(tokenAddress);

  // Retrieve a token icon from the token list if specified (filtering relative paths)
  const tokenData = tokenMapping[normalisedAddress];
  const iconFromMapping = !tokenData?.logoURI?.startsWith('/') && tokenData?.logoURI;

  // We pass chainId == udnefined if it's an NFT
  if (chainId === undefined) {
    return iconFromMapping || 'erc721.png';
  }

  // Fall back to TrustWallet/assets for logos
  const chainName = getChainTrustWalletName(chainId);
  const iconFromTrust = chainName && `${TRUSTWALLET_BASE_URL}/${chainName}/assets/${normalisedAddress}/logo.png`;

  return iconFromMapping || iconFromTrust || 'erc20.png';
}

export const fallbackTokenIconOnError = (ev: any) => {
  ev.target.src = '/assets/images/fallback-token-icon.png';
};
