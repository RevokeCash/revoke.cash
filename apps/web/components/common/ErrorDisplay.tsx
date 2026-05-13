'use client';

import { getChainName } from '@revoke.cash/core/chains';
import { isTransientError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { AddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { useTranslations } from 'next-intl';
import { useContext, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import WithHoverTooltip from './WithHoverTooltip';

interface Props {
  error: any;
  chainId?: number;
  className?: string;
}

const ErrorDisplay = ({ error, chainId, className }: Props) => {
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
      <div className={twMerge('min-w-0 truncate', className)}>⚠ {shortMessage}</div>
    </WithHoverTooltip>
  );
};

const getErrorMessage = (error: any, selectedChainId: number | undefined, t: ReturnType<typeof useTranslations>) => {
  if (isTransientError(error)) {
    if (selectedChainId) {
      const chainName = getChainName(selectedChainId);
      return t('common.errors.messages.chain_could_not_connect', { chainName });
    }
  }

  return parseErrorMessage(error);
};

export default ErrorDisplay;
