import { ChainId } from '@revoke.cash/chains';
import { ERC20_ABI, ERC721_ABI } from '@revoke.cash/core/abis';
import { DUMMY_ADDRESS, DUMMY_ADDRESS_2, WHOIS_BASE_URL } from '@revoke.cash/core/constants';
import { type TokenEvent, TokenEventType } from '@revoke.cash/core/events';
import ky from '@revoke.cash/core/ky';
import type { Nullable } from '@revoke.cash/core/types';
import { formatFixedPointBigInt } from '@revoke.cash/core/utils/formatting';
import { withFallback } from '@revoke.cash/core/utils/promises';
import { type Address, getAddress, type PublicClient } from 'viem';
import { SpamError } from './utils/errors';

export interface TokenReference {
  address: Address;
  standard: TokenStandard;
}

export interface TokenData {
  token: TokenReference;
  metadata: TokenMetadata;
  chainId: number;
  owner: Address;
  // `undefined` means the balance hasn't been fetched yet
  balance?: TokenBalance;
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

export type TokenBalance = bigint | 'Unknown';

export type TokenStandard = 'erc20' | 'erc721';

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

const getTokenMetadataFromMapping = async (
  address: Address,
  chainId: number,
): Promise<(TokenMetadata & { isSpam?: boolean }) | undefined> => {
  try {
    const metadata = await ky
      .get(`${WHOIS_BASE_URL}/tokens/${chainId}/${getAddress(address)}.json`)
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

export const getTokenMetadata = async (
  token: TokenReference,
  publicClient: PublicClient,
  chainId: number,
): Promise<TokenMetadata> => {
  const metadataFromMapping = await getTokenMetadataFromMapping(token.address, chainId);
  // Whois-flagged spam short-circuits before any RPC — no need to spend reads on a token we'll throw out anyway.
  if (metadataFromMapping?.isSpam) throw new SpamError('whois');

  if (isErc721(token)) {
    const [symbol] = await Promise.all([
      metadataFromMapping?.symbol ??
        withFallback(
          publicClient.readContract({ address: token.address, abi: ERC721_ABI, functionName: 'name' }),
          token.address,
        ),
      throwIfNotErc721(token.address, publicClient),
    ]);

    if (isSpamTokenSymbol(symbol)) throw new SpamError('symbol');
    return { ...metadataFromMapping, symbol, price: null, decimals: 0 };
  }

  const [totalSupply, symbol, decimals] = await Promise.all([
    publicClient.readContract({ address: token.address, abi: ERC20_ABI, functionName: 'totalSupply' }),
    metadataFromMapping?.symbol ??
      withFallback(
        publicClient.readContract({ address: token.address, abi: ERC20_ABI, functionName: 'symbol' }),
        token.address,
      ),
    metadataFromMapping?.decimals ??
      publicClient.readContract({ address: token.address, abi: ERC20_ABI, functionName: 'decimals' }),
    // TODO: I'm temporarily disabling this check because of false positives on Sei network
    // Make sure to add this back when we have a solution for Sei
    metadataFromMapping || chainId === ChainId.SeiNetwork ? undefined : throwIfNotErc20(token.address, publicClient), // Don't check if we have metadata from the mapping
  ]);

  if (isSpamTokenSymbol(symbol)) throw new SpamError('symbol');

  // Price will be loaded separately via useTokenPrice hook
  return { ...metadataFromMapping, totalSupply, symbol: String(symbol), decimals, price: null };
};

export const getTokenMetadataUnknown = async (
  address: Address,
  publicClient: PublicClient,
): Promise<TokenMetadata | undefined> => {
  const results = await Promise.allSettled([
    getTokenMetadata({ address, standard: 'erc20' }, publicClient, publicClient.chain!.id),
    getTokenMetadata({ address, standard: 'erc721' }, publicClient, publicClient.chain!.id),
  ]);

  return results.reduce(
    // biome-ignore lint/performance/noAccumulatingSpread: list is so small that it doesn't matter
    (acc, result) => (result.status === 'fulfilled' ? { ...acc, ...result.value } : acc),
    undefined as TokenMetadata | undefined,
  );
};

export const throwIfNotErc20 = async (address: Address, publicClient: PublicClient) => {
  // If the function allowance does not exist it will throw (and is not ERC20)
  const allowance = await publicClient.readContract({
    address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [DUMMY_ADDRESS, DUMMY_ADDRESS_2],
  });

  // The only acceptable value for checking the allowance from 0x00...01 to 0x00...02 is 0
  // This could happen when the contract is not ERC20 but does have a fallback function
  if (allowance !== 0n) {
    throw new Error('Response to allowance was not 0, indicating that this is not an ERC20 contract');
  }
};

export const throwIfNotErc721 = async (address: Address, publicClient: PublicClient) => {
  // If the function isApprovedForAll does not exist it will throw (and is not ERC721)
  const isApprovedForAll = await publicClient.readContract({
    address,
    abi: ERC721_ABI,
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
export const throwIfSpamBytecode = async (address: Address, publicClient: PublicClient): Promise<void> => {
  const bytecode = (await publicClient.getCode({ address })) ?? '';

  // This is technically possible, but I've seen many "spam" NFTs with a very tiny bytecode, which we want to filter out
  if (bytecode.length < 250) {
    if (bytecode === '0xef') return; // Tempo marks precompiles with 0xef

    // (Minimal) proxies should not be marked as spam
    if (bytecode.endsWith('57fd5bf3')) return; // EIP1167 minimal proxy
    if (bytecode.includes('360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc')) return; // EIP1967 proxy

    // Somehow ApeChain minimal proxies have a different bytecode (I guess because of slight EVM differences)
    // - see https://apescan.io/address/0x90b4d884964392a6d998EcE041214F8D375bb25b
    // TODO: Make this minimal proxy check more robust for those kinds of cases
    // if (bytecode.match(/363d3d373d3d3d363d[0-9a-f]{2}[0-9a-f]{0,40}5af43d82803e903d9160[0-9a-f]{2}57fd5bf3$/i)) return;

    throw new SpamError('bytecode');
  }
};

export const hasZeroBalance = (balance: TokenBalance, decimals?: number) => {
  return balance !== 'Unknown' && formatFixedPointBigInt(balance, decimals) === '0';
};

// Derives the canonical token reference (address + standard) from an indexed event. Returns undefined
// for events that aren't token approval/transfer events. Replaces the old createTokenContract accessor.
export const getEventTokenReference = (event: TokenEvent): TokenReference | undefined => {
  const standard = getEventTokenStandard(event);
  return standard ? { address: event.token, standard } : undefined;
};

const getEventTokenStandard = (event: TokenEvent): TokenStandard | undefined => {
  switch (event.type) {
    case TokenEventType.TRANSFER_ERC20:
    case TokenEventType.APPROVAL_ERC20:
    case TokenEventType.PERMIT2:
      return 'erc20';
    case TokenEventType.TRANSFER_ERC721:
    case TokenEventType.APPROVAL_ERC721:
    case TokenEventType.APPROVAL_FOR_ALL:
      return 'erc721';
    default:
      return undefined;
  }
};

export const isErc721 = (token: TokenReference): boolean => {
  return token.standard === 'erc721';
};

export const ownsAnyOf = (ownedOrAllowedTokens: TokenData[], tokens: Address[]) => {
  const tokenIsOwned = (expectedAddress: Address) =>
    ownedOrAllowedTokens.some(
      (token) => token.token.address === expectedAddress && typeof token.balance === 'bigint' && token.balance > 0n,
    );

  return tokens.some(tokenIsOwned);
};
