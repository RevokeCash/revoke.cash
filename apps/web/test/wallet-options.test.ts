import { expect } from 'chai';
import { type WalletOption, withOathWalletOption } from '../lib/utils/walletOptions';

describe('Wallet connection options', () => {
  const injected = { id: 'io.metamask', name: 'MetaMask', connector: { transport: 'injected' } };
  const walletConnect = { id: 'walletConnect', name: 'WalletConnect', connector: { transport: 'remote' } };
  const coinbase = { id: 'coinbaseWalletSDK', name: 'Coinbase Wallet', connector: { transport: 'coinbase' } };

  it('adds a direct Oath option using the same connector without replacing generic WalletConnect', () => {
    const original = [injected, walletConnect, coinbase];
    const options = withOathWalletOption(original);

    expect(options.map(({ id }) => id)).to.deep.equal([
      'io.metamask',
      'oath-wallet',
      'walletConnect',
      'coinbaseWalletSDK',
    ]);
    expect(options[1].connector).to.equal(walletConnect.connector);
    expect(options[2]).to.equal(walletConnect);
    expect(original).to.deep.equal([injected, walletConnect, coinbase]);
  });

  it('does not offer an unusable Oath option when WalletConnect is unavailable', () => {
    expect(withOathWalletOption([injected, coinbase])).to.deep.equal([injected, coinbase]);
    expect(withOathWalletOption([])).to.deep.equal([]);
  });

  it('keeps the input order, including the mobile WalletConnect priority', () => {
    const options: readonly WalletOption<{ transport: string }>[] = [walletConnect, coinbase, injected];
    expect(withOathWalletOption(options).map(({ id }) => id)).to.deep.equal([
      'oath-wallet',
      'walletConnect',
      'coinbaseWalletSDK',
      'io.metamask',
    ]);
  });
});
