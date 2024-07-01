'use client';

import Button from 'components/common/Button';
import ConnectButton from 'components/header/ConnectButton';
import { useMounted } from 'lib/hooks/useMounted';
import { ReactNode } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';

interface Props {
  chainId: number;
  label: ReactNode;
}

const AddNetworkButton = ({ chainId, label }: Props) => {
  const { switchChain } = useSwitchChain();
  const { isConnected } = useAccount();
  const isMounted = useMounted();

  return isConnected && isMounted ? (
    <Button style="primary" size="md" onClick={() => switchChain({ chainId })}>
      {label}
    </Button>
  ) : (
    <ConnectButton style="primary" size="md" />
  );
};

export default AddNetworkButton;
