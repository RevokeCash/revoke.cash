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
  const errorMessage = parseErrorMessage(error);
  const message = errorMessage.includes('HTTP request failed') ? chainConnectionMessage : errorMessage;
  return <div>Error: {message}</div>;
};

const parseErrorMessage = (error: any) => {
  const errorMessage = error?.error?.message ?? error?.data?.message ?? error?.message ?? error;

  if (typeof errorMessage === 'object') {
    try {
      return JSON.stringify(errorMessage);
    } catch {
      return String(errorMessage);
    }
  }

  return errorMessage;
};

export default Error;
