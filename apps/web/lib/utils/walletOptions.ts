export const OATH_WALLETCONNECT_ID = '79f336977e239d92625bdecf3f2e20a2d8f9974b5fa884d23ec02c9b82e075ce';

export interface WalletOption<ConnectorType> {
  id: string;
  name: string;
  icon?: string;
  connector: ConnectorType;
}

// Oath is a presentation option for the existing WalletConnect connector.
// Sharing the connector preserves session restoration and the actual connected wallet's identity.
export const withOathWalletOption = <ConnectorType>(options: readonly WalletOption<ConnectorType>[]) =>
  options.flatMap((option) =>
    option.id === 'walletConnect'
      ? [
          {
            id: 'oath-wallet',
            name: 'Oath Wallet',
            icon: '/assets/images/vendor/wallets/oath-wallet.svg',
            connector: option.connector,
          },
          option,
        ]
      : [option],
  );
