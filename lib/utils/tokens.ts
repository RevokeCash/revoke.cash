import type { Provider } from '@ethersproject/abstract-provider';
import { Contract, utils } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { ERC20, ERC721Metadata } from 'lib/abis';
import { DUMMY_ADDRESS, DUMMY_ADDRESS_2 } from 'lib/constants';
import { ALL_TOKENS_MAPPING } from 'lib/data/token-mapping';
import type { BaseTokenData, Log } from 'lib/interfaces';
import { toFloat } from '.';
import { convertString, unpackResult, withFallback } from './promises';

export const isSpamToken = (token: { symbol: string }) => {
  const includesHttp = /https?:\/\//i.test(token.symbol);
  // This is not exhaustive, but we can add more TLDs to the list as needed, better than nothing
  const includesTld =
    /\.com|\.io|\.xyz|\.org|\.me|\.site|\.net|\.fi|\.vision|\.team|\.app|\.exchange|\.cash|\.finance|\.cc|\.cloud|\.fun|\.wtf|\.game|\.games|\.city/i.test(
      token.symbol
    );
  return includesHttp || includesTld;
};

export const getTokenIcon = (tokenAddress: string) => {
  const normalisedAddress = utils.getAddress(tokenAddress);

  // Retrieve a token icon from the token list if specified (filtering relative paths)
  const tokenData = ALL_TOKENS_MAPPING[normalisedAddress];
  const iconFromMapping = !tokenData?.logoURI?.startsWith('/') && tokenData?.logoURI;

  return iconFromMapping || '/assets/images/fallback-token-icon.png';
};

export const fallbackTokenIconOnError = (ev: any) => {
  ev.target.src = '/assets/images/fallback-token-icon.png';
};

export const getTokenData = async (
  contract: Contract,
  ownerAddress: string,
  transfersFrom: Log[],
  transfersTo: Log[]
): Promise<BaseTokenData> => {
  if (isErc721Contract(contract)) {
    return getErc721TokenData(contract, ownerAddress, transfersFrom, transfersTo);
  }

  return getErc20TokenData(contract, ownerAddress);
};

export const getErc20TokenData = async (contract: Contract, ownerAddress: string) => {
  const tokenData = ALL_TOKENS_MAPPING[utils.getAddress(contract.address)];
  const icon = getTokenIcon(contract.address);

  const [totalSupplyBN, balance, symbol, decimals] = await Promise.all([
    unpackResult(contract.functions.totalSupply()),
    convertString(unpackResult(contract.functions.balanceOf(ownerAddress))),
    // Use the tokenlist symbol + decimals if present (simplifies handing MKR et al)
    tokenData?.symbol ?? unpackResult(contract.functions.symbol()),
    tokenData?.decimals ?? unpackResult(contract.functions.decimals()),
    throwIfNotErc20(contract),
  ]);

  const totalSupply = totalSupplyBN.toString();
  return { contract, symbol, decimals, icon, totalSupply, balance };
};

export const getErc721TokenData = async (
  contract: Contract,
  ownerAddress: string,
  transfersFrom: Log[],
  transfersTo: Log[]
) => {
  const tokenData = ALL_TOKENS_MAPPING[utils.getAddress(contract.address)];
  const icon = getTokenIcon(contract.address);

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

  return { contract, symbol, balance, icon };
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
  return toFloat(token.balance, token.decimals) === '0';
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
