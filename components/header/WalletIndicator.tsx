import { useEthereum } from 'lib/hooks/useEthereum';
import ChainSelect from '../common/ChainSelect';
import ConnectButton from './ConnectButton';

interface Props {
  menuAlign?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'none';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
}

const WalletIndicator = ({ menuAlign, size, style, className }: Props) => {
  const { switchInjectedWalletChain, connectedChainId, account } = useEthereum();

  return (
    <div className="flex gap-2">
      {account && (
        <ChainSelect onSelect={switchInjectedWalletChain} selected={connectedChainId} menuAlign={menuAlign} />
      )}
      <ConnectButton size={size} style={style} className={className} />
    </div>
  );
};

export default WalletIndicator;
