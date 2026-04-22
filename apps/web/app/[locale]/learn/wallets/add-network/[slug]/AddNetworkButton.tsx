'use client';

import Button from 'components/common/Button';
import ConnectButton from 'components/header/ConnectButton';
import { useSwitchChain } from 'lib/hooks/ethereum/useSwitchChain';
import { useMounted } from 'lib/hooks/useMounted';
import type { ReactNode } from 'react';
import { useAccount } from 'wagmi';

interface Props {
  chainId: number;
  label: ReactNode;
}

const AddNetworkButton = ({ chainId, label }: Props) => {
  const { switchChain } = useSwitchChain();
  const { isConnected } = useAccount();
  const isMounted = useMounted();

  if (isConnected && isMounted) {
    return (
      <Button style="primary" size="md" onClick={() => switchChain(chainId)}>
        {label}
      </Button>
    );
  }

  return <ConnectButton style="primary" size="md" />;
};

export default AddNetworkButton;
