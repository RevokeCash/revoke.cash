import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { getChainName } from 'lib/utils/chains';
import useTranslation from 'next-translate/useTranslation';
import { useEffect } from 'react';

interface Props {
  error: any;
}

const Error = ({ error }: Props) => {
  const { t } = useTranslation();
  const { selectedChainId } = useAddressPageContext();

  useEffect(() => {
    console.log(error);
  }, []);

  const chainName = getChainName(selectedChainId);
  const chainConnectionMessage = t('common:errors.messages.chain_could_not_connect', { chainName });
  const errorMessage = error?.error?.message ?? error?.data?.message ?? error?.message;
  const message = error.message.includes('missing response') ? chainConnectionMessage : errorMessage;
  return <div>Error: {message}</div>;
};

export default Error;
