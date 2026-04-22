import type { Connector } from 'wagmi';
import { deduplicateArray } from '.';

export const getWalletIcon = (connector: Connector): string | undefined => {
  const walletName = getConnectorName(connector);

  // Take logos from rainbowkit
  const BASE_URL =
    'https://raw.githubusercontent.com/rainbow-me/rainbowkit/9dd23d9e350c430622e15a629bab78d7cc89c566/packages/rainbowkit/src/wallets/walletConnectors';
  const walletNameLowerCase = walletName.toLowerCase();

  const mapping: Record<string, string> = {
    // Injected wallets
    '1inchwallet': '/assets/images/vendor/wallets/1inch.svg',
    abstract: '/assets/images/vendor/wallets/abstract.jpg',
    backpack: '/assets/images/vendor/wallets/backpack.svg',
    'bifrost wallet': '/assets/images/vendor/wallets/bifrost.svg',
    bitkeep: '/assets/images/vendor/wallets/bitkeep.svg',
    bitski: `${BASE_URL}/bitskiWallet/bitskiWallet.svg`,
    blockwallet: '/assets/images/vendor/wallets/block-wallet.jpg',
    'brave wallet': `${BASE_URL}/braveWallet/braveWallet.svg`,
    'core wallet': '/assets/images/vendor/wallets/core-wallet.svg',
    'dawn wallet': `${BASE_URL}/dawnWallet/dawnWallet.svg`,
    defiant: '/assets/images/vendor/wallets/defiant.svg',
    enkrypt: '/assets/images/vendor/wallets/enkrypt.svg',
    exodus: '/assets/images/vendor/wallets/exodus.svg',
    frame: '/assets/images/vendor/wallets/frame.svg',
    'frontier wallet': '/assets/images/vendor/wallets/frontier.svg',
    'gamestop wallet': '/assets/images/vendor/wallets/gamestop.svg',
    'haqq wallet': '/assets/images/vendor/wallets/haqq.webp',
    'halo wallet': '/assets/images/vendor/wallets/halo.jpg', // Note: this used to be KuCoin Wallet
    'hyperpay wallet': '/assets/images/vendor/wallets/hyperpay.svg',
    imtoken: `${BASE_URL}/imTokenWallet/imTokenWallet.svg`,
    keplr: '/assets/images/vendor/wallets/keplr.png',
    mathwallet: '/assets/images/vendor/wallets/mathwallet.svg',
    metamask: `${BASE_URL}/metaMaskWallet/metaMaskWallet.svg`,
    'nova wallet': '/assets/images/vendor/wallets/nova.webp',
    'okx wallet': `${BASE_URL}/okxWallet/okxWallet.svg`,
    opera: '/assets/images/vendor/wallets/opera.svg',
    phantom: `${BASE_URL}/phantomWallet/phantomWallet.svg`,
    rabby: `${BASE_URL}/rabbyWallet/rabbyWallet.svg`,
    'rabby wallet': `${BASE_URL}/rabbyWallet/rabbyWallet.svg`,
    rainbow: `${BASE_URL}/rainbowWallet/rainbowWallet.svg`,
    status: '/assets/images/vendor/wallets/status.svg',
    taho: `${BASE_URL}/tahoWallet/tahoWallet.svg`,
    talisman: '/assets/images/vendor/wallets/talisman.svg',
    tokenpocket: '/assets/images/vendor/wallets/tokenpocket.svg',
    'trust wallet': `${BASE_URL}/trustWallet/trustWallet.svg`,
    ttwallet: '/assets/images/vendor/wallets/ttwallet.webp',
    'xdefi wallet': `${BASE_URL}/xdefiWallet/xdefiWallet.svg`,
    zerion: `${BASE_URL}/zerionWallet/zerionWallet.svg`,
    // Other connectors
    walletconnect: `${BASE_URL}/walletConnectWallet/walletConnectWallet.svg`,
    'coinbase wallet': `${BASE_URL}/coinbaseWallet/coinbaseWallet.svg`, // Also its own connector
    ledger: `${BASE_URL}/ledgerWallet/ledgerWallet.svg`,
  };

  return mapping[walletNameLowerCase] ?? connector?.icon ?? '/assets/images/vendor/wallets/injected.svg';
};

export const getConnectorName = (connector: Connector): string => {
  // It's confusing if there are multiple 'Coinbase Wallet' connectors. You can always connect to the Coinbase Wallet
  // extension using the dedicated connector
  if (connector.name === 'Coinbase Wallet' && connector.type === 'injected') {
    return 'Browser Wallet';
  }

  if (connector.name === 'Injected') {
    return 'Browser Wallet';
  }

  // imToken is branded with 'im' instead of 'Im'
  if (connector.name === 'ImToken') {
    return 'imToken';
  }

  return connector.name;
};

export const filterAndSortConnectors = (connectors: readonly Connector[]) => {
  const comparator = (a: Connector, b: Connector) => {
    // Sort MetaMask at the top
    if (a.id === 'io.metamask') return -1;
    if (b.id === 'io.metamask') return 1;

    // Sort other multi-provider discovered connectors next
    if (a.id.includes('.')) return -1;
    if (b.id.includes('.')) return -1;

    // Sort other injected connectors next
    if (a.type === 'injected') return -1;
    if (b.type === 'injected') return 1;

    return 0;
  };

  return deduplicateArray(connectors, getConnectorName)
    .filter((c) => c.id !== 'safe')
    .sort(comparator);
};
