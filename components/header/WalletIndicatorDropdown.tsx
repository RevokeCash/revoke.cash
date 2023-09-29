import DropdownMenu, { DropdownMenuItem } from 'components/common/DropdownMenu';
import { useNameLookup } from 'lib/hooks/ethereum/useNameLookup';
import { shortenAddress } from 'lib/utils/formatting';
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
        <DropdownMenu menuButton={domainName ?? shortenAddress(account, 4)}>
          <DropdownMenuItem href={`/address/${account}`} router>
            {t('common:buttons.my_allowances')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => disconnect()}>{t('common:buttons.disconnect')}</DropdownMenuItem>
        </DropdownMenu>
      ) : (
        <ConnectButton size={size} style={style} className={className} redirect />
      )}
    </div>
  );
};

export default WalletIndicatorDropdown;
