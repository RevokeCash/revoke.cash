import { abstractWalletConnector } from '@abstract-foundation/agw-react/connectors';
import { toPrivyWalletConnector } from '@privy-io/cross-app-connect/rainbow-kit';
import { createViemPublicClientForChain, getViemChainConfig, ORDERED_CHAINS } from '@revoke.cash/core/chains';
import type { Chain } from 'viem';
import { createConfig } from 'wagmi';
import { coinbaseWallet, injected, safe, walletConnect } from 'wagmi/connectors';

const veeFriendsConnector = toPrivyWalletConnector({
  id: 'cm5158iom02kdwmj4wj527lc4',
  name: 'VeeFriends Wallet',
  iconUrl: '/assets/images/vendor/wallets/veefriends.svg',
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
            description:
              'Take back control of your wallet and stay safe by revoking token approvals and permissions you granted on Ethereum and over 100 other networks.',
            url: 'https://revoke.cash',
            icons: ['https://revoke.cash/assets/images/revoke-icon-orange-black.svg', 'https://revoke.cash/icon.png'],
          },
        }),
      ]
    : []),
  coinbaseWallet({ appName: 'Revoke.cash' }),
  abstractWalletConnector(),
  veeFriendsConnector,
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
