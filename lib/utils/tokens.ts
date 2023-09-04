import axios from 'axios';
import { ERC20_ABI, ERC721_ABI } from 'lib/abis';
import { DATA_BASE_URL, DUMMY_ADDRESS, DUMMY_ADDRESS_2 } from 'lib/constants';
import type {
  AllowanceData,
  BaseAllowanceData,
  BaseTokenData,
  TokenContract,
  Log,
  TokenFromList,
  Erc20TokenContract,
  Erc721TokenContract,
  Contract,
  Balance,
} from 'lib/interfaces';
import { toFloat } from '.';
import { formatErc20Allowance } from './allowances';
import { getPermitDomain } from './permit';
import { withFallback } from './promises';
import { Abi, Address, PublicClient, getAbiItem, getAddress, getEventSelector } from 'viem';

export const isSpamToken = (allowance: AllowanceData) => {
  const includesHttp = /https?:\/\//i.test(allowance.metadata.symbol);
  // This is not exhaustive, but we can add more TLDs to the list as needed, better than nothing
  const tldRegex =
    /\.com|\.io|\.xyz|\.org|\.me|\.site|\.net|\.fi|\.vision|\.team|\.app|\.exchange|\.cash|\.finance|\.cc|\.cloud|\.fun|\.wtf|\.game|\.games|\.city|\.claims|\.family|\.events/i;
  const includesTld = tldRegex.test(allowance.metadata.symbol);
  return includesHttp || includesTld;
};

export const getTokenData = async (
  contract: TokenContract,
  owner: Address,
  transfersFrom: Log[],
  transfersTo: Log[],
  chainId: number,
): Promise<BaseTokenData> => {
  if (isErc721Contract(contract)) {
    return getErc721TokenData(contract, owner, transfersFrom, transfersTo, chainId);
  }

  return getErc20TokenData(contract, owner, chainId);
};

export const getErc20TokenData = async (
  contract: Erc20TokenContract,
  owner: Address,
  chainId: number,
): Promise<BaseTokenData> => {
  const tokenData = await getTokenDataFromMapping(contract, chainId);
  const icon = tokenData?.logoURI;

  if (tokenData?.isSpam) throw new Error('Token is marked as spam');

  const [totalSupply, balance, symbol, decimals] = await Promise.all([
    contract.publicClient.readContract({ ...contract, functionName: 'totalSupply' }),
    contract.publicClient.readContract({ ...contract, functionName: 'balanceOf', args: [owner] }),
    // Use the tokenlist symbol + decimals if present (simplifies handing MKR et al)
    tokenData?.symbol ??
      withFallback(contract.publicClient.readContract({ ...contract, functionName: 'symbol' }), contract.address),
    tokenData?.decimals ?? contract.publicClient.readContract({ ...contract, functionName: 'decimals' }),
    throwIfNotErc20(contract),
  ]);

  const metadata = { symbol, icon, decimals, totalSupply };
  return { contract, metadata, chainId, owner, balance };
};

export const getErc721TokenData = async (
  contract: Erc721TokenContract,
  owner: Address,
  transfersFrom: Log[],
  transfersTo: Log[],
  chainId: number,
): Promise<BaseTokenData> => {
  const tokenData = await getTokenDataFromMapping(contract, chainId);
  const icon = tokenData?.logoURI;

  if (tokenData?.isSpam) throw new Error('Token is marked as spam');

  const shouldFetchBalance = transfersFrom.length === 0 && transfersTo.length === 0;
  const calculatedBalance = BigInt(transfersTo.length - transfersFrom.length);

  const [balance, symbol] = await Promise.all([
    shouldFetchBalance
      ? withFallback<Balance>(
          contract.publicClient.readContract({ ...contract, functionName: 'balanceOf', args: [owner] }),
          'ERC1155',
        )
      : calculatedBalance,
    // Use the tokenlist name if present, fall back to address since not every NFT has a name
    tokenData?.symbol ??
      withFallback(contract.publicClient.readContract({ ...contract, functionName: 'name' }), contract.address),
    throwIfNotErc721(contract),
    throwIfSpamNft(contract),
  ]);

  const metadata = { symbol, icon };

  return { contract, metadata, chainId, owner, balance };
};

const getTokenDataFromMapping = async (
  contract: TokenContract,
  chainId: number,
): Promise<TokenFromList | undefined> => {
  try {
    const tokenData = await axios.get(`${DATA_BASE_URL}/tokens/${chainId}/${getAddress(contract.address)}.json`);
    return tokenData.data;
  } catch {
    return undefined;
  }
};

export const throwIfNotErc20 = async (contract: Erc20TokenContract) => {
  // If the function allowance does not exist it will throw (and is not ERC20)
  const allowance = await contract.publicClient.readContract({
    ...contract,
    functionName: 'allowance',
    args: [DUMMY_ADDRESS, DUMMY_ADDRESS_2],
  });

  // The only acceptable value for checking the allowance from 0x00...01 to 0x00...02 is 0
  // This could happen when the contract is not ERC20 but does have a fallback function
  if (allowance !== 0n) {
    throw new Error('Response to allowance was not 0, indicating that this is not an ERC20 contract');
  }
};

export const throwIfNotErc721 = async (contract: Erc721TokenContract) => {
  // If the function isApprovedForAll does not exist it will throw (and is not ERC721)
  const isApprovedForAll = await contract.publicClient.readContract({
    ...contract,
    functionName: 'isApprovedForAll',
    args: [DUMMY_ADDRESS, DUMMY_ADDRESS_2],
  });

  // The only acceptable value for checking whether 0x00...01 has an allowance set to 0x00...02 is false
  // This could happen when the contract is not ERC721 but does have a fallback function
  if (isApprovedForAll !== false) {
    throw new Error('Response to isApprovedForAll was not false, indicating that this is not an ERC721 contract');
  }
};

// TODO: Improve spam checks
// TODO: Investigate other proxy patterns to see if they result in false positives
export const throwIfSpamNft = async (contract: Contract) => {
  const bytecode = await contract.publicClient.getBytecode({ address: contract.address });

  // This is technically possible, but I've seen many "spam" NFTs with a very tiny bytecode, which we want to filter out
  if (bytecode.length < 250) {
    // Minimal proxies should not be marked as spam
    if (bytecode.match(/^0x363d3d373d3d3d363d[0-9a-f]{2}[0-9a-f]{0,40}5af43d82803e903d9160[0-9a-f]{2}57fd5bf3$/i))
      return;

    throw new Error('Contract bytecode indicates a "spam" token');
  }
};

export const hasZeroBalance = (balance: Balance, decimals?: number) => {
  return balance !== 'ERC1155' && toFloat(balance, decimals) === '0';
};

export const hasZeroAllowance = (allowance: BaseAllowanceData, tokenData: BaseTokenData) => {
  return (
    formatErc20Allowance(allowance.amount, tokenData?.metadata?.decimals, tokenData?.metadata?.totalSupply) === '0'
  );
};

export const createTokenContracts = (events: Log[], publicClient: PublicClient): TokenContract[] => {
  return events
    .filter((event, i) => i === events.findIndex((other) => event.address === other.address))
    .map((event) => createTokenContract(event, publicClient))
    .filter((contract) => contract !== undefined);
};

const createTokenContract = (event: Log, publicClient: PublicClient): TokenContract | undefined => {
  const { address } = event;
  const abi = getTokenAbi(event);
  if (!abi) return undefined;

  return { address, abi, publicClient } as TokenContract;
};

const getTokenAbi = (event: Log): typeof ERC20_ABI | typeof ERC721_ABI | undefined => {
  const Topics = {
    TRANSFER: getEventSelector(getAbiItem({ abi: ERC20_ABI, name: 'Transfer' })),
    APPROVAL: getEventSelector(getAbiItem({ abi: ERC20_ABI, name: 'Approval' })),
    APPROVAL_FOR_ALL: getEventSelector(getAbiItem({ abi: ERC721_ABI, name: 'ApprovalForAll' })),
  };

  if (![Topics.TRANSFER, Topics.APPROVAL, Topics.APPROVAL_FOR_ALL].includes(event.topics[0])) return undefined;
  if (event.topics[0] === Topics.APPROVAL_FOR_ALL) return ERC721_ABI;
  if (event.topics.length === 4) return ERC721_ABI;
  if (event.topics.length === 3) return ERC20_ABI;

  return undefined;
};

export const isErc721Contract = (contract: TokenContract): contract is Erc721TokenContract => {
  return getAbiItem<any, string>({ ...contract, name: 'ApprovalForAll' }) !== undefined;
};

export const hasSupportForPermit = async (contract: TokenContract) => {
  if (isErc721Contract(contract)) return false;

  // If we can properly retrieve the EIP712 domain and nonce, it supports permit
  try {
    await Promise.all([
      getPermitDomain(contract),
      contract.publicClient.readContract({ ...contract, functionName: 'nonces', args: [DUMMY_ADDRESS] }),
    ]);
    return true;
  } catch (e) {
    return false;
  }
};
