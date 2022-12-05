import type { Log, Provider } from '@ethersproject/abstract-provider';
import axios from 'axios';
import { ChainId } from 'eth-chains';
import { Contract, utils } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { ERC20, ERC721Metadata } from 'lib/abis';
import { DUMMY_ADDRESS, DUMMY_ADDRESS_2 } from 'lib/constants';
import nftTokenMapping from 'lib/data/nft-token-mapping.json';
import type { BaseTokenData, TokenFromList, TokenMapping, TokenStandard } from 'lib/interfaces';
import { toFloat } from '.';
import { convertString, unpackResult, withFallback } from './promises';

// Check if a token is verified in the token mapping
export const isVerifiedToken = (tokenAddress: string, tokenMapping?: TokenMapping): boolean => {
  // If we don't know a verified token mapping, we skip checking verification
  if (!tokenMapping) return true;
  return tokenMapping[utils.getAddress(tokenAddress)] !== undefined;
};

export const isSpamToken = (token: { symbol: string }) => {
  const includesHttp = /https?:\/\//i.test(token.symbol);
  // This is not exhaustive, but we can add more TLDs to the list as needed, better than nothing
  const includesTld =
    /\.com|\.io|\.xyz|\.org|\.me|\.site|\.net|\.fi|\.vision|\.team|\.app|\.exchange|\.cash|\.finance|\.cc/i.test(
      token.symbol
    );
  return includesHttp || includesTld;
};

export const getFullTokenMapping = async (chainId: number): Promise<TokenMapping | undefined> => {
  if (!chainId) return undefined;

  const erc20Mapping = await getTokenMapping(chainId, 'ERC20');
  const erc721Mapping = nftTokenMapping;

  if (erc20Mapping === undefined && erc721Mapping === undefined) return undefined;

  const fullMapping = { ...erc721Mapping, ...erc20Mapping };
  return fullMapping;
};

const getTokenMapping = async (
  chainId: number,
  standard: TokenStandard = 'ERC20'
): Promise<TokenMapping | undefined> => {
  const url = getTokenListUrl(chainId, standard);

  try {
    const res = await axios.get(url);
    const tokens: TokenFromList[] = res.data.tokens;

    const tokenMapping = {};
    for (const token of tokens) {
      tokenMapping[utils.getAddress(token.address)] = token;
    }

    return tokenMapping;
  } catch {
    // Fallback to 1inch token mapping
    return getTokenMappingFrom1inch(chainId);
  }
};

const getTokenMappingFrom1inch = async (chainId: number): Promise<TokenMapping | undefined> => {
  try {
    const { data: mapping } = await axios.get(`https://tokens.1inch.io/v1.1/${chainId}`);

    const tokenMapping = Object.fromEntries(
      Object.entries(mapping).map(([address, token]) => [utils.getAddress(address), token])
    );

    return tokenMapping as TokenMapping;
  } catch {
    return undefined;
  }
};

const getTokenListUrl = (chainId: number, standard: TokenStandard = 'ERC20'): string | undefined => {
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
};

export const getTokenIcon = (tokenAddress: string, tokenMapping: TokenMapping = {}) => {
  const normalisedAddress = utils.getAddress(tokenAddress);

  // Retrieve a token icon from the token list if specified (filtering relative paths)
  const tokenData = tokenMapping[normalisedAddress];
  const iconFromMapping = !tokenData?.logoURI?.startsWith('/') && tokenData?.logoURI;

  return iconFromMapping || 'fallback-token-icon.png';
};

export const fallbackTokenIconOnError = (ev: any) => {
  ev.target.src = '/assets/images/fallback-token-icon.png';
};

export const getTokenData = async (
  contract: Contract,
  ownerAddress: string,
  tokenMapping: TokenMapping = {},
  transfersFrom: Log[],
  transfersTo: Log[]
): Promise<BaseTokenData> => {
  if (isErc721Contract(contract)) {
    return getErc721TokenData(contract, ownerAddress, tokenMapping, transfersFrom, transfersTo);
  }

  return getErc20TokenData(contract, ownerAddress, tokenMapping);
};

export const getErc20TokenData = async (contract: Contract, ownerAddress: string, tokenMapping: TokenMapping = {}) => {
  const tokenData = tokenMapping[utils.getAddress(contract.address)];
  const icon = getTokenIcon(contract.address, tokenMapping);
  const verified = isVerifiedToken(contract.address, tokenMapping);

  const [totalSupplyBN, balance, symbol, decimals] = await Promise.all([
    unpackResult(contract.functions.totalSupply()),
    convertString(unpackResult(contract.functions.balanceOf(ownerAddress))),
    // Use the tokenlist symbol + decimals if present (simplifies handing MKR et al)
    tokenData?.symbol ?? unpackResult(contract.functions.symbol()),
    tokenData?.decimals ?? unpackResult(contract.functions.decimals()),
    throwIfNotErc20(contract),
  ]);

  const totalSupply = totalSupplyBN.toString();
  return { symbol, decimals, icon, verified, totalSupply, balance };
};

export const getErc721TokenData = async (
  contract: Contract,
  ownerAddress: string,
  tokenMapping: TokenMapping = {},
  transfersFrom: Log[],
  transfersTo: Log[]
) => {
  const tokenData = tokenMapping[utils.getAddress(contract.address)];
  const icon = getTokenIcon(contract.address, tokenMapping);
  const verified = isVerifiedToken(contract.address, tokenMapping);

  const shouldFetchBalance = transfersFrom.length === 0 && transfersTo.length === 0;
  const calculatedBalance = String(transfersTo.length - transfersFrom.length);

  // TOOD: Balance requests for NFTs can be super slow so we need a workaround
  const [balance, symbol] = await Promise.all([
    shouldFetchBalance
      ? withFallback(convertString(unpackResult(contract.functions.balanceOf(ownerAddress))), 'ERC1155')
      : calculatedBalance,
    // Use the tokenlist name if present, fall back to address since not every NFT has a name
    tokenData?.symbol ?? withFallback(unpackResult(contract.functions.name()), contract.address),
    throwIfNotErc721(contract),
    throwIfSpamNft(contract),
  ]);

  return { symbol, balance, icon, verified };
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

export const throwIfSpamNft = async (contract: Contract) => {
  const bytecode = await contract.provider.getCode(contract.address);

  // This is technically possible, but I've seen many "spam" NFTs with a very tiny bytecode, which we want to filter out
  if (bytecode.length < 600) {
    throw new Error('Contract bytecode indicates a "spam" token');
  }
};

export const hasZeroBalance = (token: { balance: string; decimals?: number }) => {
  return toFloat(Number(token.balance), token.decimals) === '0.000';
};

export const createTokenContracts = (events: Log[], provider: Provider): Contract[] => {
  return events
    .filter((event, i) => i === events.findIndex((other) => event.address === other.address))
    .map((event) => createTokenContract(event, provider))
    .filter((contract) => contract !== undefined);
};

const createTokenContract = (event: Log, provider: Provider): Contract | undefined => {
  const tokenInterface = getTokenInterface(event);
  if (!tokenInterface) return undefined;
  return new Contract(utils.getAddress(event.address), tokenInterface, provider);
};

const getTokenInterface = (event: Log): Interface | undefined => {
  const erc20Interface = new Interface(ERC20);
  const erc721Interface = new Interface(ERC721Metadata);

  const Topics = {
    TRANSFER: erc20Interface.getEventTopic('Transfer'),
    APPROVAL: erc20Interface.getEventTopic('Approval'),
    APPROVAL_FOR_ALL: erc721Interface.getEventTopic('ApprovalForAll'),
  };

  if (![Topics.TRANSFER, Topics.APPROVAL, Topics.APPROVAL_FOR_ALL].includes(event.topics[0])) return undefined;
  if (event.topics[0] === Topics.APPROVAL_FOR_ALL) return erc721Interface;
  if (event.topics.length === 4) return erc721Interface;
  if (event.topics.length === 3) return erc20Interface;

  return undefined;
};

export const isErc721Contract = (contract: Contract) => {
  return contract.interface.events['ApprovalForAll(address,address,bool)'] !== undefined;
};
