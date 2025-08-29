import { useAccount, useSwitchChain } from "wagmi";
import { useRevokeWallet } from "../../hooks/useRevokeWallet";
import ConnectButton from "./ConnectButton";
import WalletIndicatorDropdown from "./WalletIndicatorDropdown";
import ChainSelect from "./ChainSelect";

interface Props {
  mobile?: boolean;
}

const WalletIndicator = ({ mobile = false }: Props) => {
  const { isConnected } = useRevokeWallet();
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!isConnected) {
    return <ConnectButton />;
  }

  return (
    <div className={`flex ${mobile ? 'flex-col gap-4 items-stretch w-full' : 'flex-row gap-2 items-center w-auto'}`}>
      <ChainSelect 
        selected={chain?.id} 
        onSelect={(chainId) => switchChain({ chainId })}
      />
      <WalletIndicatorDropdown mobile={mobile} />
    </div>
  );
};

export default WalletIndicator;