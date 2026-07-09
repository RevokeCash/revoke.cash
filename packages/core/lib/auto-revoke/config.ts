import { ChainId } from '@revoke.cash/chains';
import { ORDERED_CHAINS } from '@revoke.cash/core/chains';

// Source: https://docs.metamask.io/smart-accounts-kit/get-started/supported-networks/#advanced-permissions-erc-7715
const UNORDERED_AUTO_REVOKE_CHAINS = [
  ChainId.EthereumMainnet,
  // ChainId.ArbitrumNova,
  ChainId.ArbitrumOne,
  ChainId.Base,
  // ChainId.Berachain,
  ChainId.BNBSmartChainMainnet,
  // ChainId.CitreaMainnet,
  ChainId.Gnosis,
  ChainId.Linea,
  ChainId.Monad,
  ChainId.OPMainnet,
  ChainId.PolygonMainnet,
  // ChainId.SeiNetwork,
  // ChainId.SonicMainnet,
  ChainId.Unichain,
  // Testnets
  ChainId.EthereumSepolia,
] as const;

export type AutoRevokeSupportedChainId = (typeof AUTO_REVOKE_SUPPORTED_CHAINS)[number];

// Sorted by position in the main chain selector for consistent ordering
export const AUTO_REVOKE_SUPPORTED_CHAINS = [...UNORDERED_AUTO_REVOKE_CHAINS].sort(
  (a, b) => ORDERED_CHAINS.indexOf(a) - ORDERED_CHAINS.indexOf(b),
);

export const isAutoRevokeSupportedChain = (chainId: number): chainId is AutoRevokeSupportedChainId => {
  return AUTO_REVOKE_SUPPORTED_CHAINS.includes(chainId);
};

export const AUTO_REVOKE_MONTHLY_GAS_BUDGET_USD = 5;
export const AUTO_REVOKE_MAX_ACTION_COST_USD = 2;

export const PERMISSION_EXPIRY_SECONDS = 10 * 365 * 24 * 60 * 60; // 10 years

// Per signing wallet: the urgent and normal lanes each have their own pipeline of this depth
export const MAX_PENDING_ACTIONS_PER_CHAIN = 10;

export const STALE_APPROVAL_THRESHOLD_MIN_DAYS = 1;
export const STALE_APPROVAL_THRESHOLD_MAX_DAYS = 365;
export const STALE_APPROVAL_THRESHOLD_DEFAULT_DAYS = 30;
