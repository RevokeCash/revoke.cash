import { ChainId } from '@revoke.cash/chains';
import { ERC20_ABI, ERC721_ABI } from 'lib/abis';
import { DUMMY_ADDRESS, DUMMY_ADDRESS_2, WHOIS_BASE_URL } from 'lib/constants';
import type { Contract, Nullable } from 'lib/interfaces';
import ky from 'lib/ky';
import {
  type Address,
  domainSeparator,
  getAbiItem,
  getAddress,
  type PublicClient,
  pad,
  type TypedDataDomain,
  toHex,
} from 'viem';
import { deduplicateArray } from '.';
import analytics from './analytics';
import { isApprovalTokenEvent, isTransferTokenEvent, type TimeLog, type TokenEvent, TokenEventType } from './events';
import { formatFixedPointBigInt } from './formatting';
import { withFallback } from './promises';

export interface TokenData {
  contract: Erc20TokenContract | Erc721TokenContract;
  metadata: TokenMetadata;
  chainId: number;
  owner: Address;
  balance: TokenBalance;
}

export interface PermitTokenData extends TokenData {
  lastCancelled?: TimeLog;
}

export type TokenContract = Erc20TokenContract | Erc721TokenContract;

export interface Erc20TokenContract extends Contract {
  abi: typeof ERC20_ABI;
}

export interface Erc721TokenContract extends Contract {
  abi: typeof ERC721_ABI;
}

export interface TokenMetadata {
  // name: string;
  symbol: string;
  icon?: string;
  decimals?: number;
  totalSupply?: bigint;
  // Price will be loaded separately (undefined until loaded, null if no price available)
  price?: Nullable<number>;
}

export type TokenBalance = bigint | 'ERC1155';

export type TokenStandard = 'ERC20' | 'ERC721';

interface TokenFromList {
  symbol: string;
  decimals?: number;
  logoURI?: string;
  isSpam?: boolean;
}

export const isSpamTokenSymbol = (symbol: string) => {
  const spamRegexes = [
    // Includes http(s)://
    /https?:\/\//i,
    // Includes a TLD (this is not exhaustive, but we can add more TLDs to the list as needed - better than nothing)
    /\.com|\.io|\.xyz|\.org|\.me|\.site|\.net|\.fi|\.vision|\.team|\.app|\.exchange|\.cash|\.finance|\.cc|\.cloud|\.fun|\.wtf|\.game|\.games|\.city|\.claims|\.family|\.events|\.to|\.us|\.vip|\.ly|\.lol|\.biz|\.life|\.pm|\.lat|.bar/i,
    // Includes "www."
    /www\./i,
    // Includes common spam words
    /visit .+ claim|free claim|claim on|airdrop at|airdrop voucher|✅.+ airdrop|✅.+ reward|✅.+ voucher|USDТ airdrop/i,
    // Includes $ or ＄ symbols
    /＄|\$ /i,
  ];

  return spamRegexes.some((regex) => regex.test(symbol));
};

export const getTokenData = async (
  contract: TokenContract,
  events: TokenEvent[],
  owner: Address,
  chainId: number,
): Promise<TokenData> => {
  if (isErc721Contract(contract)) {
    return getErc721TokenData(contract, owner, events, chainId);
  }

  return getErc20TokenData(contract, owner, events, chainId);
};

export const getErc20TokenData = async (
  contract: Erc20TokenContract,
  owner: Address,
  events: TokenEvent[],
  chainId: number,
): Promise<TokenData> => {
  const [metadata, balance] = await Promise.all([
    getTokenMetadata(contract, chainId),
    contract.publicClient.readContract({ ...contract, functionName: 'balanceOf', args: [owner] }),
    throwIfSpam(contract, events),
  ]);

  return { contract, metadata, chainId, owner, balance };
};

export const getErc721TokenData = async (
  contract: Erc721TokenContract,
  owner: Address,
  events: TokenEvent[],
  chainId: number,
): Promise<TokenData> => {
  const transfers = events.filter((event) => event.type === TokenEventType.TRANSFER_ERC721);

  // Since the events are sorted by reverse chronological order, we know that the first event is the latest,
  // if the latest event for a tokenId is a transfer to the owner, then the owner still holds the token
  const uniqueTokenIdTransfers = deduplicateArray(transfers, (event) => `${event.payload.tokenId}`);
  const calculatedBalance = BigInt(uniqueTokenIdTransfers.filter((event) => event.payload.to === owner).length);
  const shouldFetchBalance = transfers.length === 0;

  const [metadata, balance] = await Promise.all([
    getTokenMetadata(contract, chainId),
    shouldFetchBalance
      ? withFallback<TokenBalance>(
          contract.publicClient.readContract({ ...contract, functionName: 'balanceOf', args: [owner] }),
          'ERC1155',
        )
      : calculatedBalance,
    throwIfSpam(contract, events),
  ]);

  return { contract, metadata, chainId, owner, balance };
};

const getTokenDataFromMapping = async (
  contract: TokenContract,
  chainId: number,
): Promise<(TokenMetadata & { isSpam?: boolean }) | undefined> => {
  try {
    const metadata = await ky
      .get(`${WHOIS_BASE_URL}/tokens/${chainId}/${getAddress(contract.address)}.json`)
      .json<TokenFromList>();

    if (!metadata || Object.keys(metadata).length === 0) return undefined;

    return {
      symbol: metadata.symbol,
      decimals: metadata.decimals,
      icon: metadata.logoURI,
      isSpam: metadata.isSpam,
    };
  } catch {
    return undefined;
  }
};

export const getTokenMetadata = async (contract: TokenContract, chainId: number): Promise<TokenMetadata> => {
  const metadataFromMapping = await getTokenDataFromMapping(contract, chainId);
  if (metadataFromMapping?.isSpam) throw new Error('Token is marked as spam in metadata');

  if (isErc721Contract(contract)) {
    const [symbol] = await Promise.all([
      metadataFromMapping?.symbol ??
        withFallback(contract.publicClient.readContract({ ...contract, functionName: 'name' }), contract.address),
      throwIfNotErc721(contract),
    ]);

    if (isSpamTokenSymbol(symbol)) throw new Error('Token symbol looks like spam');
    return { ...metadataFromMapping, symbol, price: null, decimals: 0 };
  }

  const [totalSupply, symbol, decimals] = await Promise.all([
    contract.publicClient.readContract({ ...contract, functionName: 'totalSupply' }),
    metadataFromMapping?.symbol ??
      withFallback(contract.publicClient.readContract({ ...contract, functionName: 'symbol' }), contract.address),
    metadataFromMapping?.decimals ?? contract.publicClient.readContract({ ...contract, functionName: 'decimals' }),
    // TODO: I'm temporarily disabling this check because of false positives on Sei network
    // Make sure to add this back when we have a solution for Sei
    metadataFromMapping || chainId === ChainId.SeiNetwork ? undefined : throwIfNotErc20(contract), // Don't check if we have metadata from the mapping
  ]);

  if (isSpamTokenSymbol(symbol)) throw new Error('Token symbol looks like spam');

  // Price will be loaded separately via useTokenPrice hook
  return { ...metadataFromMapping, totalSupply, symbol: String(symbol), decimals, price: null };
};

export const getTokenMetadataUnknown = async (
  address: Address,
  publicClient: PublicClient,
): Promise<TokenMetadata | undefined> => {
  const results = await Promise.allSettled([
    getTokenMetadata({ address, abi: ERC20_ABI, publicClient }, publicClient.chain!.id),
    getTokenMetadata({ address, abi: ERC721_ABI, publicClient }, publicClient.chain!.id),
  ]);

  return results.reduce(
    (acc, result) => (result.status === 'fulfilled' ? { ...acc, ...result.value } : acc),
    undefined as TokenMetadata | undefined,
  );
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
export const throwIfSpam = async (contract: TokenContract, events: TokenEvent[]) => {
  await Promise.all([throwIfSpamAirdrop(contract, events), throwIfSpamBytecode(contract)]);
};

// TODO: Investigate other proxy patterns to see if they result in false positives
export const throwIfSpamBytecode = async (contract: TokenContract) => {
  const bytecode = (await contract.publicClient.getCode({ address: contract.address })) ?? '';

  // This is technically possible, but I've seen many "spam" NFTs with a very tiny bytecode, which we want to filter out
  if (bytecode.length < 250) {
    // Minimal proxies should not be marked as spam
    if (bytecode.length < 100 && bytecode.endsWith('57fd5bf3')) return;

    // Somehow ApeChain minimal proxies have a different bytecode (I guess because of slight EVM differences)
    // - see https://apescan.io/address/0x90b4d884964392a6d998EcE041214F8D375bb25b
    // TODO: Make this minimal proxy check more robust for those kinds of cases
    // if (bytecode.match(/363d3d373d3d3d363d[0-9a-f]{2}[0-9a-f]{0,40}5af43d82803e903d9160[0-9a-f]{2}57fd5bf3$/i)) return;

    throw new Error('Contract bytecode indicates a "spam" token');
  }
};

export const throwIfSpamAirdrop = async (_contract: Contract, events: TokenEvent[]) => {
  const transferTransactions = events.filter(isTransferTokenEvent).map((event) => event.time.transactionHash);
  const approvalTransactions = events.filter(isApprovalTokenEvent).map((event) => event.time.transactionHash);

  // If the transfers and approvals occur in the same transaction, it's a spam transaction
  // Note that we only check if that is the case for *all* events to prevent false positives at the cost of false negatives
  if (
    transferTransactions.length > 0 &&
    transferTransactions.every((transaction) => approvalTransactions.includes(transaction))
  ) {
    throw new Error('Contract is a spam airdrop');
  }
};

export const hasZeroBalance = (balance: TokenBalance, decimals?: number) => {
  return balance !== 'ERC1155' && formatFixedPointBigInt(balance, decimals) === '0';
};

export const createTokenContracts = (events: TokenEvent[], publicClient: PublicClient): TokenContract[] => {
  // Remove transfer events FROM the owner, because if that is the *only* event, it's likely a spam token
  const filteredEvents = events.filter((event) => !(isTransferTokenEvent(event) && event.owner === event.payload.from));

  return deduplicateArray(filteredEvents, (event) => event.token)
    .map((event) => createTokenContract(event, publicClient))
    .filter((contract) => contract !== undefined);
};

export const createTokenContract = (event: TokenEvent, publicClient: PublicClient): TokenContract | undefined => {
  const abi = getTokenAbi(event);
  if (!abi) return undefined;

  return { address: event.token, abi, publicClient } as TokenContract;
};

const getTokenAbi = (event: TokenEvent): typeof ERC20_ABI | typeof ERC721_ABI | undefined => {
  switch (event.type) {
    case TokenEventType.TRANSFER_ERC20:
    case TokenEventType.APPROVAL_ERC20:
    case TokenEventType.PERMIT2:
      return ERC20_ABI;
    case TokenEventType.TRANSFER_ERC721:
    case TokenEventType.APPROVAL_ERC721:
    case TokenEventType.APPROVAL_FOR_ALL:
      return ERC721_ABI;
    default:
      return undefined;
  }
};

export const isErc721Contract = (contract: TokenContract): contract is Erc721TokenContract => {
  return getAbiItem<any, string>({ ...contract, name: 'ApprovalForAll' }) !== undefined;
};

export const isErc20Contract = (contract: TokenContract): contract is Erc20TokenContract => {
  return !isErc721Contract(contract);
};

// Some tokens appear to support Permit, but don't actually support it.
// TODO: Somehow fix this in the RevokeCash/whois repo instead
const IGNORE_LIST = [
  '0xb131f4A55907B10d1F0A50d8ab8FA09EC342cd74', // MEME (Ethereum)
  '0xB4FFEf15daf4C02787bC5332580b838cE39805f5', // z0ETH (Linea)
  '0x0684FC172a0B8e6A65cF4684eDb2082272fe9050', // z0ezETH (Linea)
];

export const hasSupportForPermit = async (contract: TokenContract) => {
  if (isErc721Contract(contract)) return false;
  if (IGNORE_LIST.includes(contract.address)) return false;

  // If we can properly retrieve the EIP712 domain and nonce, we assume it supports permit
  try {
    await Promise.all([
      getPermitDomain(contract),
      contract.publicClient.readContract({ ...contract, functionName: 'nonces', args: [DUMMY_ADDRESS] }),
    ]);
    return true;
  } catch {
    return false;
  }
};

export const getPermitDomain = async (contract: Erc20TokenContract): Promise<TypedDataDomain> => {
  const verifyingContract = contract.address;
  const chainId = contract.publicClient.chain!.id;

  const [version, name, symbol, contractDomainSeparator] = await Promise.all([
    getPermitDomainVersion(contract),
    contract.publicClient.readContract({ ...contract, functionName: 'name' }),
    contract.publicClient.readContract({ ...contract, functionName: 'symbol' }),
    contract.publicClient.readContract({ ...contract, functionName: 'DOMAIN_SEPARATOR' }),
  ]);

  const salt = pad(toHex(chainId), { size: 32 });

  // Given the potential fields of a domain, we try to find the one that matches the domain separator
  const potentialDomains: TypedDataDomain[] = [
    // Expected domain separators
    { name, version, chainId, verifyingContract },
    { name, version, verifyingContract, salt },
    { name: symbol, version, chainId, verifyingContract },
    { name: symbol, version, verifyingContract, salt },

    // Without version
    { name, chainId, verifyingContract },
    { name, verifyingContract, salt },
    { name: symbol, chainId, verifyingContract },
    { name: symbol, verifyingContract, salt },

    // Without name
    { version, chainId, verifyingContract },
    { version, verifyingContract, salt },

    // Without name or version
    { chainId, verifyingContract },
    { verifyingContract, salt },

    // With both chainId and salt
    { name, version, chainId, verifyingContract, salt },
    { name: symbol, version, chainId, verifyingContract, salt },
  ];

  const domain = potentialDomains.find((domain) => domainSeparator({ domain }) === contractDomainSeparator);

  if (!domain) {
    // If the domain separator is something else, we cannot generate a valid signature
    analytics.track('Permit Domain Separator Mismatch', { name, verifyingContract, chainId });
    throw new Error('Could not determine Permit Signature data');
  }

  return domain;
};

const getPermitDomainVersion = async (contract: Erc20TokenContract) => {
  const knownDomainVersions: Record<string, string> = {
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': '2', // USDC on Ethereum
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': '2', // DAI on Arbitrum and Optimism (perhaps other chains too)
  };

  if (contract.address in knownDomainVersions) {
    return knownDomainVersions[contract.address];
  }

  try {
    return await contract.publicClient.readContract({ ...contract, functionName: 'version' });
  } catch {
    return '1';
  }
};

export const ownsAnyOf = (ownedOrAllowedTokens: TokenData[], tokens: Address[]) => {
  const tokenIsOwned = (expectedAddress: Address) =>
    ownedOrAllowedTokens.some(
      (token) => token.contract.address === expectedAddress && typeof token.balance === 'bigint' && token.balance > 0n,
    );

  return tokens.some(tokenIsOwned);
};
