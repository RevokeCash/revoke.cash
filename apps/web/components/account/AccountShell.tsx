'use client';

import NoticeBanner from 'components/common/NoticeBanner';
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
    <div className="py-8 flex flex-col gap-6">
      <div className="w-full flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-semibold leading-tight">{t('common.buttons.my_account')}</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">{t('account.description')}</p>
        </div>

        <AccountNavigation />
      </div>

      {isError ? (
        <NoticeBanner style="warning" className="w-full">
          {t('account.error')}
        </NoticeBanner>
      ) : (
        children
      )}
    </div>
  );
};

export default AccountShell;
