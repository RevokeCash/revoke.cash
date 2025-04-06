'use client';

import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { getChainName } from 'lib/utils/chains';
import { isCovalentError, isNetworkError, isRateLimitError, parseErrorMessage } from 'lib/utils/errors';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

interface Props {
  error: any;
}

const Error = ({ error }: Props) => {
  const t = useTranslations();
  const { selectedChainId } = useAddressPageContext();

  useEffect(() => {
    console.log(error);
  }, [error]);

  if (isNetworkError(error) || isRateLimitError(error) || isCovalentError(error)) {
    const chainName = getChainName(selectedChainId);
    return <div>Error: {t('common.errors.messages.chain_could_not_connect', { chainName })}</div>;
  }

  return <div>Error: {parseErrorMessage(error)}</div>;
};

export default Error;
