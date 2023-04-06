export const getWalletIcon = (walletName: string): string | undefined => {
  // Take logos from rainbowkit
  const BASE_URL =
    'https://raw.githubusercontent.com/rainbow-me/rainbowkit/0d5640929326d65673596a11cd018a9c6524ff8c/packages/rainbowkit/src/wallets/walletConnectors/';
  const walletNameLowerCase = walletName.toLowerCase();

  const mapping = {
    // Injected wallets
    bitski: `${BASE_URL}/bitskiWallet/bitskiWallet.svg`,
    'brave wallet': `${BASE_URL}/braveWallet/braveWallet.svg`,
    'dawn wallet': `${BASE_URL}/dawnWallet/dawnWallet.svg`,
    // 'frame': '',
    opera: '/assets/images/vendor/wallets/opera.svg',
    phantom: '/assets/images/vendor/wallets/phantom.svg',
    rainbow: `${BASE_URL}/rainbowWallet/rainbowWallet.svg`,
    taho: `${BASE_URL}/tahoWallet/tahoWallet.svg`,
    'trust wallet': `${BASE_URL}/trustWallet/trustWallet.svg`,
    zerion: `${BASE_URL}/zerionWallet/zerionWallet.svg`,
    metamask: `${BASE_URL}/metaMaskWallet/metaMaskWallet.svg`,
    // Other connectors
    walletconnect: `${BASE_URL}/walletConnectWallet/walletConnectWallet.svg`,
    walletconnectlegacy: `${BASE_URL}/walletConnectWallet/walletConnectWallet.svg`,
    'coinbase wallet': `${BASE_URL}/coinbaseWallet/coinbaseWallet.svg`, // Also its own connector
    ledger: `${BASE_URL}/ledgerWallet/ledgerWallet.svg`,
  };

  return mapping[walletNameLowerCase] ?? `${BASE_URL}/injectedWallet/injectedWallet.svg`;
};
