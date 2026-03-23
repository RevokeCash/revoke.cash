'use client';

import Button from 'components/common/Button';
import ConnectButton from 'components/header/ConnectButton';
import { useFairsideCoverage } from 'lib/hooks/ethereum/coverage/useFairsideCoverage';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';
import ManageCoverageButton from './ManageCoverageButton';

interface UnauthenticatedActiveCoverageProps {
  account: Address;
}

const UnauthenticatedActiveCoverage = ({ account }: UnauthenticatedActiveCoverageProps) => {
  const t = useTranslations();
  const { hasWalletClient, authenticate, isAuthenticating } = useFairsideCoverage(account);

  return (
    <>
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.coverage.wallets_description')}</span>
      <div className="flex items-center gap-2">
        {hasWalletClient ? (
          <Button style="secondary" size="sm" onClick={authenticate} loading={isAuthenticating} className="w-fit">
            {isAuthenticating ? t('common.buttons.authenticating') : t('common.buttons.authenticate')}
          </Button>
        ) : (
          <ConnectButton style="secondary" size="sm" />
        )}
        <ManageCoverageButton />
      </div>
    </>
  );
};

export default UnauthenticatedActiveCoverage;
