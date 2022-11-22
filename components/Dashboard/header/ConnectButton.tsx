import Button from 'components/common/Button';
import Spinner from 'components/common/Spinner';
import { useEthereum } from 'lib/hooks/useEthereum';
import { shortenAddress } from 'lib/utils';
import useTranslation from 'next-translate/useTranslation';
import { useAsyncCallback } from 'react-async-hook';
import ChainSelect from './ChainSelect';

const ConnectButton = () => {
  const { t } = useTranslation();
  const { account, ensName, unsName, connect, disconnect } = useEthereum();
  const domainName = ensName ?? unsName;

  const { execute, loading } = useAsyncCallback(connect);
  const buttonAction = account ? disconnect : execute;
  const buttonText = account ? t('common:buttons.disconnect') : t('common:buttons.connect');

  return (
    <div className="h-full flex">
      <div className="h-full flex -mr-px">
        <ChainSelect />
      </div>
      {account && (
        <div className="flex justify-center items-center grow border border-black bg-gray-200 px-3 py-1.5">
          {domainName ?? shortenAddress(account)}
        </div>
      )}
      <Button style="secondary" size="md" onClick={buttonAction} className="rounded-l-none -ml-px">
        {loading ? <Spinner style="secondary" /> : buttonText}
      </Button>
    </div>
  );
};

export default ConnectButton;
