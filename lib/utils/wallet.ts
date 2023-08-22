import { Connector } from 'wagmi';

export const getWalletIcon = (walletName: string): string | undefined => {
  // Take logos from rainbowkit
  const BASE_URL =
    'https://raw.githubusercontent.com/rainbow-me/rainbowkit/47e578f82efafda1e7127755105141c4a6b61c66/packages/rainbowkit/src/wallets/walletConnectors';
  const walletNameLowerCase = walletName.toLowerCase();

  const mapping = {
    // Injected wallets
    '1inchwallet': '/assets/images/vendor/wallets/1inch.svg',
    // 'apex wallet': 'TODO: Can't find good logo ',
    backpack: '/assets/images/vendor/wallets/backpack.svg',
    'bifrost wallet': `/assets/images/vendor/wallets/bifrost.svg`,
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
    mathwallet: '/assets/images/vendor/wallets/mathwallet.svg',
    metamask: `${BASE_URL}/metaMaskWallet/metaMaskWallet.svg`,
    'nova wallet': '/assets/images/vendor/wallets/nova.webp',
    'okx wallet': `${BASE_URL}/okxWallet/okxWallet.svg`,
    opera: '/assets/images/vendor/wallets/opera.svg',
    phantom: `${BASE_URL}/phantomWallet/phantomWallet.svg`,
    // 'ripio portal': 'TODO: Can't find good logo',
    rabby: `${BASE_URL}/rabbyWallet/rabbyWallet.svg`,
    'rabby wallet': `${BASE_URL}/rabbyWallet/rabbyWallet.svg`,
    rainbow: `${BASE_URL}/rainbowWallet/rainbowWallet.svg`,
    status: '/assets/images/vendor/wallets/status.svg',
    taho: `${BASE_URL}/tahoWallet/tahoWallet.svg`,
    talisman: '/assets/images/vendor/wallets/talisman.svg',
    // tokenary: 'TODO: Can't find good logo',
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

  return mapping[walletNameLowerCase] ?? `/assets/images/vendor/wallets/injected.svg`;
};

export const getConnectorName = (connector: Connector): string => {
  // It's confusing if there are multiple 'Coinbase Wallet' connectors. You can always connect to the Coinbase Wallet
  // extension using the dedicated connector
  if (connector.name === 'Coinbase Wallet' && connector.id === 'injected') {
    return 'Browser Wallet';
  }

  // imToken is branded with 'im' instead of 'Im'
  if (connector.name === 'ImToken') {
    return 'imToken';
  }

  return connector.name;
};
