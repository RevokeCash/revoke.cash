import Button from 'components/common/Button';
import DropdownMenu from 'components/common/DropdownMenu';
import { useNameLookup } from 'lib/hooks/ethereum/useNameLookup';
import { shortenAddress } from 'lib/utils';
import useTranslation from 'next-translate/useTranslation';
import { useAccount, useDisconnect } from 'wagmi';
import ConnectButton from './ConnectButton';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'none';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
}

const WalletIndicatorDropdown = ({ size, style, className }: Props) => {
  const { t } = useTranslation();
  const { address: account } = useAccount();
  const { ensName, unsName, avvyName } = useNameLookup(account);
  const { disconnect } = useDisconnect();
  const domainName = ensName ?? unsName ?? avvyName;

  return (
    <div className="flex whitespace-nowrap">
      {account ? (
        <DropdownMenu menuButton={domainName ?? shortenAddress(account)}>
          <Button
            style="secondary"
            size="md"
            className="rounded-none border-none font-normal"
            align="left"
            href={`/address/${account}`}
            router
          >
            {t('common:buttons.my_allowances')}
          </Button>
          <Button
            style="secondary"
            size="md"
            className="rounded-none border-none font-normal"
            align="left"
            onClick={() => disconnect()}
          >
            {t('common:buttons.disconnect')}
          </Button>
        </DropdownMenu>
      ) : (
        <ConnectButton size={size} style={style} className={className} />
      )}
    </div>
  );
};

export default WalletIndicatorDropdown;
