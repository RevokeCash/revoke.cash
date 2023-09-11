import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { getChainName } from 'lib/utils/chains';
import { isNetworkError, parseErrorMessage } from 'lib/utils/errors';
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
  const message = isNetworkError(errorMessage) ? chainConnectionMessage : errorMessage;
  return <div>Error: {message}</div>;
};

export default Error;
