import { ChainId } from '@revoke.cash/chains';
import { CHAIN_SELECT_MAINNETS } from 'lib/utils/chains';

// Source: https://docs.metamask.io/smart-accounts-kit/get-started/supported-networks/#advanced-permissions-erc-7715
const UNORDERED_AUTO_REVOKE_CHAINS = [
  ChainId.EthereumMainnet,
  ChainId.ArbitrumNova,
  ChainId.ArbitrumOne,
  ChainId.Base,
  ChainId.Berachain,
  ChainId.BNBSmartChainMainnet,
  ChainId.CitreaMainnet,
  ChainId.Gnosis,
  ChainId.Monad,
  ChainId.OPMainnet,
  ChainId.PolygonMainnet,
  ChainId.SonicMainnet,
  ChainId.Unichain,
] as const;

export type AutoRevokeSupportedChainId = (typeof AUTO_REVOKE_SUPPORTED_CHAINS)[number];

// Sorted by position in the main chain selector for consistent ordering
export const AUTO_REVOKE_SUPPORTED_CHAINS = [...UNORDERED_AUTO_REVOKE_CHAINS].sort(
  (a, b) => CHAIN_SELECT_MAINNETS.indexOf(a) - CHAIN_SELECT_MAINNETS.indexOf(b),
);

export const isAutoRevokeSupportedChain = (chainId: number): chainId is AutoRevokeSupportedChainId => {
  return AUTO_REVOKE_SUPPORTED_CHAINS.includes(chainId);
};

export const REVOKE_SESSION_ACCOUNT_ADDRESS = process.env.NEXT_PUBLIC_REVOKE_SESSION_ACCOUNT_ADDRESS;

export const PERMISSION_EXPIRY_SECONDS = 10 * 365 * 24 * 60 * 60; // 10 years

export const STALE_APPROVAL_THRESHOLD_MIN_DAYS = 1;
export const STALE_APPROVAL_THRESHOLD_MAX_DAYS = 365;
export const STALE_APPROVAL_THRESHOLD_DEFAULT_DAYS = 30;
