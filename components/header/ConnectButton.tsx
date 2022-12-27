import Button from 'components/common/Button';
import DropdownMenu from 'components/common/DropdownMenu';
import { useEthereum } from 'lib/hooks/useEthereum';
import { shortenAddress } from 'lib/utils';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';

const ConnectButton = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { account, ensName, unsName, connect, disconnect } = useEthereum();
  const domainName = ensName ?? unsName;

  const connectAndRedirect = async () => {
    const address = await connect();
    if (address) {
      router.push(`/address/${address}`);
    }
  };

  return (
    <div className="flex whitespace-nowrap">
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
            {t('common:buttons.my_allowances')}
          </Button>
          <Button style="secondary" size="md" className="rounded-none border-none" align="left" onClick={disconnect}>
            {t('common:buttons.disconnect')}
          </Button>
        </DropdownMenu>
      ) : (
        <Button style="primary" size="md" onClick={connectAndRedirect}>
          {t('common:buttons.connect')}
        </Button>
      )}
    </div>
  );
};

export default ConnectButton;
