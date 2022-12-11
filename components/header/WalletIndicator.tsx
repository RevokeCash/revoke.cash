import { useEthereum } from 'lib/hooks/useEthereum';
import ChainSelect from '../common/ChainSelect';
import ConnectButton from './ConnectButton';

const WalletIndicator = () => {
  const { switchInjectedWalletChain, connectedChainId, account } = useEthereum();

  return (
    <div className="flex gap-2">
      {account && <ChainSelect onSelect={switchInjectedWalletChain} selected={connectedChainId} />}
      <ConnectButton />
    </div>
  );
};

export default WalletIndicator;
