'use client';

import { useMounted } from 'lib/hooks/useMounted';
import { Suspense } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import ChainSelect from '../common/select/ChainSelect';
import WalletIndicatorDropdown from './WalletIndicatorDropdown';

interface Props {
  menuAlign?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'none';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
}

// TODO: Looks like sometimes the connected chain doesn't sync up with the actual wallet chain
const WalletIndicator = ({ menuAlign, size, style, className }: Props) => {
  const isMounted = useMounted();
  const { address: account, chain } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!isMounted) return null;

  return (
    <Suspense>
      <div className="flex gap-2">
        {account && (
          <ChainSelect
            instanceId="global-chain-select"
            onSelect={(chainId) => switchChain({ chainId })}
            selected={chain?.id}
            menuAlign={menuAlign}
          />
        )}
        <WalletIndicatorDropdown size={size} style={style} className={className} />
      </div>
    </Suspense>
  );
};

export default WalletIndicator;
