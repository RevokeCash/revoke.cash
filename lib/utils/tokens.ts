import type { Provider } from '@ethersproject/abstract-provider';
import { Contract, utils } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { ERC20, ERC721Metadata } from 'lib/abis';
import { DUMMY_ADDRESS, DUMMY_ADDRESS_2 } from 'lib/constants';
import { TOKEN_MAPPING } from 'lib/data/token-mapping';
import type { AllowanceData, BaseTokenData, Log } from 'lib/interfaces';
import { toFloat } from '.';
import spamTokens from '../data/spam-tokens.json';
import { getPermitDomain } from './permit';
import { convertString, unpackResult, withFallback } from './promises';

export const isSpamToken = (allowance: AllowanceData) => {
  const includesHttp = /https?:\/\//i.test(allowance.symbol);
  // This is not exhaustive, but we can add more TLDs to the list as needed, better than nothing
  const tldRegex =
    /\.com|\.io|\.xyz|\.org|\.me|\.site|\.net|\.fi|\.vision|\.team|\.app|\.exchange|\.cash|\.finance|\.cc|\.cloud|\.fun|\.wtf|\.game|\.games|\.city|\.claims|\.family|\.events/i;
  const includesTld = tldRegex.test(allowance.symbol);
  return includesHttp || includesTld || spamTokens.includes(allowance.contract.address);
};

export const getTokenData = async (
  contract: Contract,
  owner: string,
  transfersFrom: Log[],
  transfersTo: Log[],
  chainId: number
): Promise<BaseTokenData> => {
  if (isErc721Contract(contract)) {
    return getErc721TokenData(contract, owner, transfersFrom, transfersTo, chainId);
  }

  return getErc20TokenData(contract, owner, chainId);
};

export const getErc20TokenData = async (contract: Contract, owner: string, chainId: number): Promise<BaseTokenData> => {
  const tokenData = TOKEN_MAPPING[chainId]?.[utils.getAddress(contract.address)];
  const icon = tokenData?.logoURI;

  const [totalSupplyBN, balance, symbol, decimals] = await Promise.all([
    unpackResult(contract.functions.totalSupply()),
    convertString(unpackResult(contract.functions.balanceOf(owner))),
    // Use the tokenlist symbol + decimals if present (simplifies handing MKR et al)
    tokenData?.symbol ?? withFallback(unpackResult(contract.functions.symbol()), contract.address),
    tokenData?.decimals ?? unpackResult(contract.functions.decimals()),
    throwIfNotErc20(contract),
  ]);

  const totalSupply = totalSupplyBN.toString();
  return { contract, chainId, symbol, owner, decimals, icon, totalSupply, balance };
};

export const getErc721TokenData = async (
  contract: Contract,
  owner: string,
  transfersFrom: Log[],
  transfersTo: Log[],
  chainId: number
): Promise<BaseTokenData> => {
  const tokenData = TOKEN_MAPPING[chainId]?.[utils.getAddress(contract.address)];
  const icon = tokenData?.logoURI;

  const shouldFetchBalance = transfersFrom.length === 0 && transfersTo.length === 0;
  const calculatedBalance = String(transfersTo.length - transfersFrom.length);

  const [balance, symbol] = await Promise.all([
    shouldFetchBalance
      ? withFallback(convertString(unpackResult(contract.functions.balanceOf(owner))), 'ERC1155')
      : calculatedBalance,
    // Use the tokenlist name if present, fall back to address since not every NFT has a name
    tokenData?.symbol ?? withFallback(unpackResult(contract.functions.name()), contract.address),
    throwIfNotErc721(contract),
    throwIfSpamNft(contract),
  ]);

  return { contract, chainId, symbol, owner, balance, icon };
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

// TODO: Improve spam checks
// TODO: Investigate other proxy patterns to see if they result in false positives
export const throwIfSpamNft = async (contract: Contract) => {
  const bytecode = await contract.provider.getCode(contract.address);

  // This is technically possible, but I've seen many "spam" NFTs with a very tiny bytecode, which we want to filter out
  if (bytecode.length < 250) {
    // Minimal proxies should not be marked as spam
    if (bytecode.match(/^0x363d3d373d3d3d363d[0-9a-f]{2}[0-9a-f]{0,40}5af43d82803e903d9160[0-9a-f]{2}57fd5bf3$/i))
      return;

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

export const hasSupportForPermit = async (contract: Contract) => {
  if (isErc721Contract(contract)) return false;

  // If we can properly retrieve the EIP712 domain and nonce, it supports permit
  try {
    await Promise.all([getPermitDomain(contract), contract.functions.nonces(DUMMY_ADDRESS)]);
    return true;
  } catch (e) {
    return false;
  }
};
