import Button from 'components/common/Button';
import DropdownMenu from 'components/common/dropdown/DropdownMenu';
import { useEthereum } from 'lib/hooks/useEthereum';
import { shortenAddress } from 'lib/utils';
import useTranslation from 'next-translate/useTranslation';

const ConnectButton = () => {
  const { t } = useTranslation();
  const { account, ensName, unsName, connect, disconnect } = useEthereum();
  const domainName = ensName ?? unsName;

  return (
    <div className="flex">
      {account ? (
        <DropdownMenu menuButton={domainName ?? shortenAddress(account)}>
          <Button
            style="secondary"
            size="md"
            className="rounded-none border-none"
            align="left"
            href={`/address/${domainName ?? account}`}
            router
          >
            My Profile
          </Button>
          <Button style="secondary" size="md" className="rounded-none border-none" align="left" onClick={disconnect}>
            {t('common:buttons.disconnect')}
          </Button>
        </DropdownMenu>
      ) : (
        <Button style="secondary" size="md" onClick={connect}>
          {t('common:buttons.connect')}
        </Button>
      )}
    </div>
  );
};

export default ConnectButton;
