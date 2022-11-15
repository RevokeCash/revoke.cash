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
  const buttonAction = account ? disconnect : execute;
  const buttonText = account ? t('common:buttons.disconnect') : t('common:buttons.connect');
  const buttonTextLoading = account ? t('common:buttons.disconnecting') : t('common:buttons.connecting');

  return (
    <>
      <div className="h-full w-72 flex">
        <ChainSelectDropdown />

        <div className="h-full border-t border-b border-black flex ">
          <p className="self-center px-2">{account && shortenAddress(account)}</p>
        </div>

        <button
          onClick={buttonAction}
          className="h-full rounded border border-black rounded-l-none bg-white px-2.5 py-1.5 text-xs font-medium text-black hover:text-white  hover:bg-gray-900 focus:outline-none duration-100"
        >
          {buttonText}
        </button>
      </div>
    </>
  );

  // return (
  // <InputGroup style={{ width: 'fit-content' }}>
  //   <InputGroup.Prepend>
  //     <ChainSelectDropdown />
  //   </InputGroup.Prepend>
  //   {account && (
  //     <InputGroup.Text style={{ borderRadius: 0, borderColor: 'black' }}>
  //       {domainName ?? shortenAddress(account)}
  //     </InputGroup.Text>
  //   )}
  //   <InputGroup.Append style={{ marginLeft: account ? -1 : 0 }}>
  //     <Button disabled={loading} variant="outline-primary" onClick={buttonAction}>
  //       {loading ? buttonTextLoading : buttonText}
  //     </Button>
  //   </InputGroup.Append>
  // </InputGroup>
  // );
};

export default ConnectButton;
