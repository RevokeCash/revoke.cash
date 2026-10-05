import { ChainId } from '@revoke.cash/core/chains/ids';
import type { PaymentTokenSymbol, PremiumPaymentChainId } from '@revoke.cash/core/premium/payment-config';

// Balances worth less than this stay where they are until they have grown enough to be worth the transactions
export const MINIMUM_MOVED_VALUE_USD = 50;

// Every treasury balance ends up as a Kraken deposit that is sold for EUR. A 'kraken' route deposits the balance as-is on
// its own chain. A 'bridge' route first moves it to an asset and network that Kraken accepts, always to our own address,
// because Kraken EU only credits first-party transfers. Bridged balances become ETH, USDC or BNB, so bridging never adds
// an asset to sell on Kraken. Relay is used unless another tool is more than 0.5 percentage points cheaper.
//
// Kraken assets and networks are named as in Kraken's deposit methods, checked on 2026-09-30. Kraken's contract addresses
// and chain ids are not used, because they are wrong for some methods (e.g. 'USDC - Polygon' points at USDC.e).
export type TreasuryRoute =
  | { type: 'kraken'; asset: string; network: string; minimumDeposit: string; method?: string }
  | { type: 'bridge'; tool: string; asset: string; network: string; steps?: string };

const kraken = (asset: string, network: string, minimumDeposit: string, method?: string): TreasuryRoute => ({
  type: 'kraken',
  asset,
  network,
  minimumDeposit,
  method,
});

const relayTo = (asset: string, network: string): TreasuryRoute => ({ type: 'bridge', tool: 'Relay', asset, network });

const lifiTo = (asset: string, network: string): TreasuryRoute => ({ type: 'bridge', tool: 'LI.FI', asset, network });

const symbiosisTo = (asset: string, network: string): TreasuryRoute => ({
  type: 'bridge',
  tool: 'Symbiosis',
  asset,
  network,
});

// Chains without a route had no working quote on Relay, LI.FI or Symbiosis on 2026-09-30, and no known Kraken deposit
// method for their native token on that network. Tempo has no native token, so it never holds fees.
const FEE_ROUTES: Partial<Record<ChainId, TreasuryRoute>> = {
  [ChainId.Ethereum]: kraken('ETH', 'Ethereum', '0.004'),
  [ChainId.RobinhoodChain]: kraken('ETH', 'Robinhood Chain', '0.0024'),
  [ChainId.BNBChain]: kraken('BNB', 'BNB Chain', '0.01'),
  [ChainId.Base]: kraken('ETH', 'Base', '0.0025'),
  [ChainId.Arbitrum]: kraken('ETH', 'Arbitrum One', '0.0025'),
  [ChainId.Optimism]: kraken('ETH', 'Optimism', '0.0025'),
  [ChainId.Polygon]: kraken('POL', 'Polygon', '6.5'),
  [ChainId.HyperEVM]: kraken('HYPE', 'HyperEVM', '0.2'),
  [ChainId.Arc]: kraken('USDC', 'Arc', '5'),
  [ChainId.Avalanche]: kraken('AVAX', 'Avalanche C-Chain', '0.5'),
  [ChainId.Ink]: kraken('ETH', 'Ink', '0.001'),
  [ChainId.ZkSyncEra]: kraken('ETH', 'zkSync Era', '0.0025'),
  [ChainId.Unichain]: kraken('ETH', 'Unichain', '0.005'),
  [ChainId.Monad]: kraken('MON', 'Monad', '50'),
  [ChainId.Sonic]: kraken('S', 'Sonic', '5'),
  [ChainId.Flare]: kraken('FLR', 'Flare', '12'),
  [ChainId.Celo]: kraken('CELO', 'Celo', '1'),
  [ChainId.Sei]: kraken('SEI', 'Sei - EVM', '25'),
  [ChainId.Berachain]: kraken('BERA', 'Berachain', '0.5'),
  [ChainId.Plasma]: kraken('XPL', 'Plasma', '5'),
  [ChainId.Songbird]: kraken('SGB', 'Songbird', '1'),
  // Kraken takes about 12 hours to credit ETC, but no bridge supports Ethereum Classic
  [ChainId.EthereumClassic]: kraken('ETC', 'Ethereum Classic', '0.01'),
  [ChainId.XDC]: kraken('XDC', 'XDC Network', '70'),
  [ChainId.Etherlink]: kraken('XTZ', 'Etherlink', '15'),
  // Kraken still lists DATA under its old name, IP on the Story network
  [ChainId.DataNetwork]: kraken('IP', 'Story', '1'),
  // Meson charges a flat 0.00051 BNB, and the BNB joins the BNB Chain deposit
  [ChainId.OpBNB]: { type: 'bridge', tool: 'Meson', asset: 'BNB', network: 'BNB Chain' },
  // Swapping APE to ETH costs about 0.7% on Symbiosis, and over 2% on Relay and LI.FI
  [ChainId.ApeChain]: symbiosisTo('ETH', 'Ethereum'),
  [ChainId.Taiko]: symbiosisTo('ETH', 'Base'),
  [ChainId.Rootstock]: symbiosisTo('ETH', 'Base'),
  // Kraken has a Linea method, but it credits deposits only after L1 finality, which takes up to 32 hours
  [ChainId.Linea]: relayTo('ETH', 'Base'),
  [ChainId.Abstract]: relayTo('ETH', 'Base'),
  [ChainId.Soneium]: relayTo('ETH', 'Base'),
  [ChainId.Blast]: relayTo('ETH', 'Base'),
  [ChainId.MegaETH]: relayTo('ETH', 'Base'),
  [ChainId.Shape]: relayTo('ETH', 'Base'),
  [ChainId.Mode]: relayTo('ETH', 'Base'),
  [ChainId.Scroll]: relayTo('ETH', 'Base'),
  [ChainId.BOB]: relayTo('ETH', 'Base'),
  [ChainId.Doma]: relayTo('ETH', 'Base'),
  [ChainId.MantaPacific]: relayTo('ETH', 'Base'),
  [ChainId.WorldChain]: relayTo('ETH', 'Base'),
  [ChainId.GnosisChain]: relayTo('ETH', 'Base'),
  [ChainId.Somnia]: relayTo('ETH', 'Base'),
  [ChainId.Ronin]: relayTo('ETH', 'Base'),
  [ChainId.Mantle]: relayTo('ETH', 'Base'),
  [ChainId.Plume]: relayTo('ETH', 'Base'),
  [ChainId.Boba]: relayTo('ETH', 'Base'),
  [ChainId.Morph]: relayTo('ETH', 'Base'),
  [ChainId.Katana]: relayTo('ETH', 'Base'),
  [ChainId.Gensyn]: relayTo('ETH', 'Base'),
  // Relay only moves the native balance on Stable through its USDT0 ERC-20 (0x779Ded0c9e1022225f8E0630b35a9b54bE713736)
  [ChainId.Stable]: relayTo('ETH', 'Base'),
  [ChainId.Metis]: lifiTo('ETH', 'Base'),
  [ChainId.FlowEVM]: lifiTo('ETH', 'Base'),
  [ChainId.Hemi]: lifiTo('ETH', 'Base'),
  [ChainId.ImmutableZkEVM]: lifiTo('ETH', 'Base'),
  // No bridge aggregator supports PulseChain. This route worked from revoke.eth on 2026-07-27, at about 0.1% for the swap
  [ChainId.PulseChain]: {
    type: 'bridge',
    tool: 'PulseX + PulseChain bridge',
    asset: 'USDC',
    network: 'Ethereum',
    steps:
      'Swap the PLS on PulseX to the USDC bridged from Ethereum (0x15D3…1B07, not the fork copy at the Ethereum USDC ' +
      'address). Bridge that USDC at bridge.pulsechain.com (0.3% fee), then claim it on Ethereum about 30 minutes later ' +
      '(needs ETH for gas). Do not bridge the PLS itself: it arrives on Ethereum as WPLS, which has no market.',
  },
};

// Kraken EEA clients cannot trade USDT, so all USDT is swapped to USDC first. Polygon USDC is bridged as well, because it
// is unclear which contract Kraken credits for its 'USDC - Polygon' method.
const SUBSCRIPTION_ROUTES: Record<PremiumPaymentChainId, Record<PaymentTokenSymbol, TreasuryRoute>> = {
  [ChainId.Ethereum]: { USDC: kraken('USDC', 'Ethereum', '2.5'), USDT: relayTo('USDC', 'Base') },
  [ChainId.BNBChain]: { USDC: relayTo('USDC', 'Base'), USDT: relayTo('USDC', 'Base') },
  [ChainId.Polygon]: { USDC: relayTo('USDC', 'Base'), USDT: relayTo('USDC', 'Base') },
  [ChainId.Base]: { USDC: kraken('USDC', 'Base', '2.5'), USDT: relayTo('USDC', 'Base') },
  [ChainId.Optimism]: { USDC: relayTo('USDC', 'Base'), USDT: relayTo('USDC', 'Base') },
  // Kraken also has a 'USDC.e - Arbitrum One' method on the same network
  [ChainId.Arbitrum]: {
    USDC: kraken('USDC', 'Arbitrum One', '2.5', 'USDC - Arbitrum One'),
    USDT: relayTo('USDC', 'Base'),
  },
};

export const getFeeRoute = (chainId: number): TreasuryRoute | null => {
  return FEE_ROUTES[chainId as ChainId] ?? null;
};

export const getSubscriptionRoute = (
  chainId: PremiumPaymentChainId,
  tokenSymbol: PaymentTokenSymbol,
): TreasuryRoute => {
  return SUBSCRIPTION_ROUTES[chainId][tokenSymbol];
};
