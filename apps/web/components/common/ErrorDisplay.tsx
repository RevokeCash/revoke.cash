'use client';

import { getChainName } from '@revoke.cash/core/chains';
import { isTooMuchActivityError, isTransientError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { AddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import { usePremiumEntitlements } from 'lib/hooks/premium/usePremiumEntitlements';
import { useTranslations } from 'next-intl';
import { useContext, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import RichText from './RichText';
import WithHoverTooltip from './WithHoverTooltip';

interface Props {
  error: any;
  chainId?: number;
  className?: string;
  withIcon?: boolean;
}

const ErrorDisplay = ({ error, chainId, className, withIcon = true }: Props) => {
  const t = useTranslations();
  // Try to get the context, but don't fail if it's not available (e.g., in premium context)
  const context = useContext(AddressPageContext);
  const selectedChainId = chainId || context?.selectedChainId;
  const { isPremium } = usePremiumEntitlements(context?.address);

  useEffect(() => {
    console.log(error);
  }, [error]);

  const fullMessage = parseErrorMessage(error);
  const shortMessage = getErrorMessage(error, selectedChainId, !context || isPremium, t);

  const tooltip = <div className="whitespace-pre-wrap">{fullMessage}</div>;

  return (
    <WithHoverTooltip tooltip={tooltip}>
      <div className={twMerge('min-w-0 overflow-hidden text-ellipsis whitespace-nowrap', className)}>
        {withIcon && '⚠ '}
        {shortMessage}
      </div>
    </WithHoverTooltip>
  );
};

const getErrorMessage = (
  error: any,
  selectedChainId: number | undefined,
  isPremium: boolean,
  t: ReturnType<typeof useTranslations>,
) => {
  if (isTooMuchActivityError(error) && selectedChainId) {
    const chainName = getChainName(selectedChainId);
    if (isPremium) return t('common.errors.messages.too_much_activity_premium', { chainName });
    return <RichText>{(tags) => t.rich('common.errors.messages.too_much_activity', { ...tags, chainName })}</RichText>;
  }

  if (isTransientError(error)) {
    if (selectedChainId) {
      const chainName = getChainName(selectedChainId);
      return t('common.errors.messages.chain_could_not_connect', { chainName });
    }
  }

  return parseErrorMessage(error);
};

export default ErrorDisplay;
