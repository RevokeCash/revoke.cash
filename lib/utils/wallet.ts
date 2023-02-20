export const getWalletIcon = (walletName: string): string | undefined => {
  // Take logos from rainbowkit
  const BASE_URL =
    'https://raw.githubusercontent.com/rainbow-me/rainbowkit/2e6bb8ff3850eb4e341d82b77d52b18df4bfd698/packages/rainbowkit/src/wallets/walletConnectors';
  const walletNameLowerCase = walletName.toLowerCase();

  const mapping = {
    metamask: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    'brave wallet': `${BASE_URL}/braveWallet/braveWallet.svg`,
    walletconnect: `${BASE_URL}/walletConnectWallet/walletConnectWallet.svg`,
    'coinbase wallet': `${BASE_URL}/coinbaseWallet/coinbaseWallet.svg`,
    ledger: `${BASE_URL}/ledgerWallet/ledgerWallet.svg`,
  };

  return mapping[walletNameLowerCase];
};
