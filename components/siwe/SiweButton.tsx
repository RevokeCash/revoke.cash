import Button from 'components/common/Button';
import ConnectButton from 'components/header/ConnectButton';
import { useSiwe } from 'lib/hooks/ethereum/useSiwe';
import { useAccount, useConnect } from 'wagmi';

export const SiweButton = () => {
  const { address } = useAccount();
  const { connectAsync, connectors } = useConnect();

  const siwe = useSiwe();

  if (!address) {
    return <ConnectButton text="Sign-in with Ethereum" onConnect={(address) => siwe.signIn(address)} size="md" />;
  }

  return (
    <Button style="primary" size="md" onClick={() => siwe.signIn(address)}>
      Sign-in with Ethereum
    </Button>
  );
};
