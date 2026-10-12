import { abstractWalletConnector } from '@abstract-foundation/agw-react/connectors';
import { toPrivyWalletConnector } from '@privy-io/cross-app-connect/rainbow-kit';
import {
  createViemPublicClientForChain,
  getViemChainConfig,
  ORDERED_CHAINS,
  ROUNDED_DOWN_NETWORK_COUNT,
} from '@revoke.cash/core/chains';
import type { Chain } from 'viem';
import { createConfig } from 'wagmi';
import { coinbaseWallet, injected, safe, walletConnect } from 'wagmi/connectors';

// The Abstract connector always registers itself with this hardcoded id
export const ABSTRACT_CONNECTOR_ID = 'xyz.abs.privy';
export const VEEFRIENDS_CONNECTOR_ID = 'cm5158iom02kdwmj4wj527lc4';
export const GLYPH_CONNECTOR_ID = 'cly38x0w10ac945q9yg9sm71i';

const veeFriendsConnector = toPrivyWalletConnector({
  id: VEEFRIENDS_CONNECTOR_ID,
  name: 'VeeFriends Wallet',
  iconUrl: '/assets/images/vendor/wallets/veefriends.svg',
});

const glyphConnector = toPrivyWalletConnector({
  id: GLYPH_CONNECTOR_ID,
  name: 'Glyph',
  iconUrl: '/assets/images/vendor/wallets/glyph.png',
});

export const connectors = [
  safe({ debug: false }),
  injected(),
  ...(typeof window !== 'undefined'
    ? [
        walletConnect({
          projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
          metadata: {
            name: 'Revoke.cash',
            description: `Take back control of your wallet and stay safe by revoking token approvals and permissions you granted on Ethereum and over ${ROUNDED_DOWN_NETWORK_COUNT} other networks.`,
            url: 'https://revoke.cash',
            icons: ['https://revoke.cash/assets/images/revoke-icon-orange-black.svg', 'https://revoke.cash/icon.png'],
          },
        }),
      ]
    : []),
  coinbaseWallet({ appName: 'Revoke.cash' }),
  abstractWalletConnector(),
  veeFriendsConnector,
  glyphConnector,
];

export const wagmiConfig = createConfig({
  chains: ORDERED_CHAINS.map(getViemChainConfig) as [Chain, ...Chain[]],
  connectors,
  client: ({ chain }) => {
    return createViemPublicClientForChain(chain.id) as any;
  },
  ssr: true,
  batch: { multicall: true } as any,
});
