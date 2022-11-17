import { useEthereum } from 'lib/hooks/useEthereum';
import { shortenAddress } from 'lib/utils';
import useTranslation from 'next-translate/useTranslation';
import { useAsyncCallback } from 'react-async-hook';
import ChainSelectDropdown from './ChainSelectDropdown';

const ConnectButton = () => {
  const { t } = useTranslation();
  const { account, ensName, unsName, connect, disconnect } = useEthereum();
  const domainName = ensName ?? unsName;

  const { execute, loading } = useAsyncCallback(connect);
  const buttonAction = account ? disconnect : connect;
  const buttonText = account ? t('common:buttons.disconnect') : t('common:buttons.connect');
  const buttonTextLoading = account ? t('common:buttons.disconnecting') : t('common:buttons.connecting');

  return (
    <>
      <div className="h-full w-72 flex">
        <ChainSelectDropdown />

        {account && (
          <div className="border-t border-black border-b bg-gray-200 flex ">
            <p className="self-center px-2 text-gray-500">{domainName ?? shortenAddress(account)}</p>
          </div>
        )}

        <button
          onClick={buttonAction}
          className="h-full rounded border border-black rounded-l-none bg-white px-2.5 py-1.5 text-xs font-medium text-black hover:text-white  hover:bg-gray-900 focus:outline-none duration-100"
        >
          {loading ? buttonTextLoading : buttonText}
        </button>
      </div>
    </>
  );
};

export default ConnectButton;
