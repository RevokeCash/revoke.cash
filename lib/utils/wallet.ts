import { Connector } from 'wagmi';

export const getWalletIcon = (walletName: string): string | undefined => {
  // Take logos from rainbowkit
  const BASE_URL =
    'https://raw.githubusercontent.com/rainbow-me/rainbowkit/0d5640929326d65673596a11cd018a9c6524ff8c/packages/rainbowkit/src/wallets/walletConnectors/';
  const walletNameLowerCase = walletName.toLowerCase();

  const mapping = {
    // Injected wallets
    '1inchw1allet': '/assets/images/vendor/wallets/1inch.svg',
    // 'apex wallet': '',
    backpack: '/assets/images/vendor/wallets/backpack.svg',
    bitkeep: '/assets/images/vendor/wallets/bitkeep.svg',
    'bifrost wallet': `/assets/images/vendor/wallets/bifrost.svg`,
    bitski: `${BASE_URL}/bitskiWallet/bitskiWallet.svg`,
    'brave wallet': `${BASE_URL}/braveWallet/braveWallet.svg`,
    'core wallet': '/assets/images/vendor/wallets/core-wallet.svg',
    'dawn wallet': `${BASE_URL}/dawnWallet/dawnWallet.svg`,
    exodus: '/assets/images/vendor/wallets/exodus.svg',
    frame: '/assets/images/vendor/wallets/frame.svg',
    'frontier wallet': '/assets/images/vendor/wallets/frontier.svg',
    'gamestop wallet': '/assets/images/vendor/wallets/gamestop.svg',
    'hyperpay wallet': '/assets/images/vendor/wallets/hyperpay.svg',
    // 'kucoin wallet': '',
    mathwallet: '/assets/images/vendor/wallets/mathwallet.svg',
    metamask: `${BASE_URL}/metaMaskWallet/metaMaskWallet.svg`,
    'okx wallet': '/assets/images/vendor/wallets/okx.svg',
    opera: '/assets/images/vendor/wallets/opera.svg',
    phantom: '/assets/images/vendor/wallets/phantom.svg',
    rainbow: `${BASE_URL}/rainbowWallet/rainbowWallet.svg`,
    // 'ripio portal': '',
    rabby: '/assets/images/vendor/wallets/rabby.svg',
    status: '/assets/images/vendor/wallets/status.svg',
    tally: `/assets/images/vendor/wallets/taho.svg`,
    taho: `/assets/images/vendor/wallets/taho.svg`,
    // tokenary: '',
    tokenpocket: '/assets/images/vendor/wallets/tokenpocket.svg',
    'trust wallet': `${BASE_URL}/trustWallet/trustWallet.svg`,
    'xdefi wallet': '/assets/images/vendor/wallets/xdefi.svg',
    zerion: `${BASE_URL}/zerionWallet/zerionWallet.svg`,
    // Other connectors
    walletconnect: `${BASE_URL}/walletConnectWallet/walletConnectWallet.svg`,
    'coinbase wallet': `${BASE_URL}/coinbaseWallet/coinbaseWallet.svg`, // Also its own connector
    ledger: `${BASE_URL}/ledgerWallet/ledgerWallet.svg`,
  };

  return mapping[walletNameLowerCase] ?? `${BASE_URL}/injectedWallet/injectedWallet.svg`;
};

export const getConnectorName = (connector: Connector): string => {
  // It's confusing if there are multiple 'Coinbase Wallet' connectors. You can always connect to the Coinbase Wallet
  // extension using the dedicated connector
  if (connector.name === 'Coinbase Wallet' && connector.id === 'injected') {
    return 'Injected';
  }

  return connector.name;
};
