import { useDisconnect } from "wagmi";
import { useRevokeWallet } from "../../hooks/useRevokeWallet";
import DropdownMenu, { DropdownMenuItem } from "../common/DropdownMenu";

interface Props {
  mobile?: boolean;
}

const WalletIndicatorDropdown = ({ mobile = false }: Props) => {
  const { address } = useRevokeWallet();
  const { disconnect } = useDisconnect();

  const shortenAddress = (addr: string, chars = 4) => {
    return `${addr.slice(0, chars + 2)}…${addr.slice(-chars)}`;
  };

  return (
    <div className={`flex whitespace-nowrap ${mobile ? 'w-full' : 'w-auto'}`}>
      {address ? (
        <DropdownMenu 
          menuButton={shortenAddress(address, 4)}
          align="right"
          style="button"
        >
          <DropdownMenuItem 
            href={`https://revoke.cash/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            My Allowances
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => disconnect()}>
            Disconnect
          </DropdownMenuItem>
        </DropdownMenu>
      ) : null}
    </div>
  );
};

export default WalletIndicatorDropdown;