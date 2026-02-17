'use client';

import { AddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { getChainName } from 'lib/utils/chains';
import { isCovalentError, isNetworkError, isRateLimitError, parseErrorMessage } from 'lib/utils/errors';
import { useTranslations } from 'next-intl';
import { useContext, useEffect } from 'react';
import WithHoverTooltip from './WithHoverTooltip';

interface Props {
  error: any;
  chainId?: number;
}

const ErrorDisplay = ({ error, chainId }: Props) => {
  const t = useTranslations();
  // Try to get the context, but don't fail if it's not available (e.g., in premium context)
  const context = useContext(AddressPageContext);
  const selectedChainId = chainId || context?.selectedChainId;

  useEffect(() => {
    console.log(error);
  }, [error]);

  const fullMessage = String(error);
  const shortMessage = getErrorMessage(error, selectedChainId, t);

  const tooltip = <div className="whitespace-pre-wrap">{fullMessage}</div>;

  return (
    <WithHoverTooltip tooltip={tooltip}>
      <div className="truncate">⚠ {shortMessage}</div>
    </WithHoverTooltip>
  );
};

const getErrorMessage = (error: any, selectedChainId: number | undefined, t: ReturnType<typeof useTranslations>) => {
  if (isNetworkError(error) || isRateLimitError(error) || isCovalentError(error)) {
    if (selectedChainId) {
      const chainName = getChainName(selectedChainId);
      return t('common.errors.messages.chain_could_not_connect', { chainName });
    }
  }

  return parseErrorMessage(error);
};

export default ErrorDisplay;
