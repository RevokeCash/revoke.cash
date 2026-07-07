export interface MockApproval {
  symbol: string;
  spender: string;
  amount: string;
  lastUpdated: string;
  monthsAgo: number;
  exploited?: boolean;
}

export const MOCK_APPROVALS: MockApproval[] = [
  { symbol: 'USDC', spender: 'Uniswap Permit2', amount: 'Unlimited', lastUpdated: '3 years ago', monthsAgo: 36 },
  { symbol: 'WETH', spender: 'Seaport 1.5 (OpenSea)', amount: 'Unlimited', lastUpdated: '2 years ago', monthsAgo: 24 },
  {
    symbol: 'UNI',
    spender: '0x7a16fF82...61c3AB9d',
    amount: 'Unlimited',
    lastUpdated: '4 years ago',
    monthsAgo: 48,
    exploited: true,
  },
  { symbol: 'PEPE', spender: 'SushiSwap Router', amount: 'Unlimited', lastUpdated: '2 years ago', monthsAgo: 24 },
  { symbol: 'LINK', spender: '1inch Router v4', amount: 'Unlimited', lastUpdated: '3 years ago', monthsAgo: 36 },
  { symbol: 'ARB', spender: 'Arbitrum Bridge', amount: '50,000', lastUpdated: '1 year ago', monthsAgo: 12 },
];

export const MOCK_CHAIN_LOGOS = [
  'images/chains/ethereum.svg',
  'images/chains/base.svg',
  'images/chains/arbitrum.svg',
  'images/chains/optimism.svg',
  'images/chains/polygon.svg',
  'images/chains/bnb-chain.svg',
  'images/chains/avalanche.svg',
];
