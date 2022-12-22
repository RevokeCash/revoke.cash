import { useEthereum } from 'lib/hooks/useEthereum';
import ChainSelect from '../common/ChainSelect';
import ConnectButton from './ConnectButton';

interface Props {
  menuAlign?: 'left' | 'right';
}

const WalletIndicator = ({ menuAlign }: Props) => {
  const { switchInjectedWalletChain, connectedChainId, account } = useEthereum();

  return (
    <div className="flex gap-2">
      {account && (
        <ChainSelect onSelect={switchInjectedWalletChain} selected={connectedChainId} menuAlign={menuAlign} />
      )}
      <ConnectButton />
    </div>
  );
};

export default WalletIndicator;
