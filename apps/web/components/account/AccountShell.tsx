'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useSiweSignIn } from 'lib/hooks/ethereum/siwe/useSiweSignIn';
import { useAccountSubscriptions } from 'lib/hooks/premium/useAccountSubscriptions';
import { useTranslations } from 'next-intl';
import AccountNavigation from './AccountNavigation';
import UnauthenticatedView from './UnauthenticatedView';

interface Props {
  children: React.ReactNode;
}

const AccountShell = ({ children }: Props) => {
  const t = useTranslations();
  const { signIn, isLoading: isAuthenticating } = useSiweSignIn();
  const { account, isAuthenticated, isError } = useAccountSubscriptions();

  if (!isAuthenticated) {
    return <UnauthenticatedView account={account} signIn={signIn} isAuthenticating={isAuthenticating} />;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold leading-tight">{t('common.buttons.my_account')}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{t('account.description')}</p>
      </div>

      <AccountNavigation />

      {isError ? (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 shrink-0 text-yellow-500" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.error')}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default AccountShell;
