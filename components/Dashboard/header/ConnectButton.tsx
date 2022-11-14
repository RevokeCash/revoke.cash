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
      <div className="h-full flex justify-center">
        <ChainSelectDropdown />
        <div className="border border-black">{account && shortenAddress(account)}</div>
        <button onClick={buttonAction} className="btn-primary border-black border-l-0 rounded-l-none">
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
