import axios from 'axios';
import { ChainId } from 'eth-chains';
import { Contract, providers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import { DUMMY_ADDRESS, DUMMY_ADDRESS_2 } from 'lib/constants';
import {
  Erc20TokenData,
  Erc721TokenData,
  isERC721Token,
  TokenData,
  TokenFromList,
  TokenMapping,
  TokenStandard,
} from 'lib/interfaces';
import { shortenAddress, toFloat } from '.';
import { convertString, unpackResult, withFallback } from './promises';

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

export function getTokenIcon(tokenAddress: string, tokenMapping: TokenMapping = {}) {
  const normalisedAddress = getAddress(tokenAddress);

  // Retrieve a token icon from the token list if specified (filtering relative paths)
  const tokenData = tokenMapping[normalisedAddress];
  const iconFromMapping = !tokenData?.logoURI?.startsWith('/') && tokenData?.logoURI;

  return iconFromMapping || 'fallback-token-icon.png';
}

export const fallbackTokenIconOnError = (ev: any) => {
  ev.target.src = '/assets/images/fallback-token-icon.png';
};

export const getErc20TokenData = async (contract: Contract, ownerAddress: string, tokenMapping: TokenMapping = {}) => {
  const tokenData = tokenMapping[getAddress(contract.address)];

  const [totalSupplyBN, balance, symbol, decimals] = await Promise.all([
    unpackResult(contract.functions.totalSupply()),
    convertString(unpackResult(contract.functions.balanceOf(ownerAddress))),
    // Use the tokenlist symbol + decimals if present (simplifies handing MKR et al)
    tokenData?.symbol ?? unpackResult(contract.functions.symbol()),
    tokenData?.decimals ?? unpackResult(contract.functions.decimals()),
    throwIfNotErc20(contract),
  ]);

  const totalSupply = totalSupplyBN.toString();
  return { symbol, decimals, totalSupply, balance };
};

export const getErc721TokenData = async (contract: Contract, ownerAddress: string, tokenMapping: TokenMapping = {}) => {
  const tokenData = tokenMapping[getAddress(contract.address)];

  const [balance, symbol] = await Promise.all([
    withFallback(convertString(unpackResult(contract.functions.balanceOf(ownerAddress))), 'ERC1155'),
    // Use the tokenlist name if present, fall back to 'shortened address since not every NFT has a name
    tokenData?.name ?? withFallback(unpackResult(contract.functions.name()), shortenAddress(contract.address)),
    throwIfNotErc721(contract),
  ]);

  return { symbol, balance };
};

export const throwIfNotErc20 = async (contract: Contract) => {
  // If the function allowance does not exist it will throw (and is not ERC20)
  const [allowance] = await contract.functions.allowance(DUMMY_ADDRESS, DUMMY_ADDRESS_2);

  // The only acceptable value for checking the allowance from 0x00...01 to 0x00...02 is 0
  // This could happen when the contract is not ERC20 but does have a fallback function
  if (allowance.toString() !== '0') {
    throw new Error('Response to allowance was not 0, indicating that this is not an ERC20 contract');
  }
};

export const throwIfNotErc721 = async (contract: Contract) => {
  // If the function isApprovedForAll does not exist it will throw (and is not ERC721)
  const [isApprovedForAll] = await contract.functions.isApprovedForAll(DUMMY_ADDRESS, DUMMY_ADDRESS_2);

  // The only acceptable value for checking whether 0x00...01 has an allowance set to 0x00...02 is false
  // This could happen when the contract is not ERC721 but does have a fallback function
  if (isApprovedForAll !== false) {
    throw new Error('Response to isApprovedForAll was not false, indicating that this is not an ERC721 contract');
  }
};

export const hasZeroBalance = (token: TokenData) => {
  return isERC721Token(token) ? token.balance === '0' : toFloat(Number(token.balance), token.decimals) === '0.000';
};

export const createTokenContracts = (events: providers.Log[], abi: any, provider: providers.Provider) => {
  return events
    .filter((event, i) => i === events.findIndex((other) => event.address === other.address))
    .map((event) => new Contract(getAddress(event.address), abi, provider));
};
