import { CheckIcon } from '@heroicons/react/24/solid';
import Button from 'components/common/Button';
import ContentPageHero from 'components/common/ContentPageHero';
import ConnectButton from 'components/header/ConnectButton';
import { usePremiumPlans } from 'lib/hooks/premium/usePremiumPlans';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';

interface Props {
  account: Address | undefined;
  signIn: () => void;
  isAuthenticating: boolean;
}

const UnauthenticatedView = ({ account, signIn, isAuthenticating }: Props) => {
  const t = useTranslations();
  const preselectedTier = useSearchParams()?.get('plan');
  const { plans } = usePremiumPlans('');

  const selectedPlan = preselectedTier ? plans.find((plan) => plan.tier === preselectedTier) : undefined;

  return (
    <div className="flex flex-col items-center">
      {selectedPlan ? (
        <ContentPageHero
          title={t('account.unauthenticated.selected_plan.title', { planName: selectedPlan.name })}
          subtitle={t('account.unauthenticated.selected_plan.summary', {
            price: `$${selectedPlan.priceUsdCents / 100}`,
            maxAddresses: selectedPlan.maxAddresses,
          })}
        />
      ) : (
        <ContentPageHero title={t('common.buttons.my_account')} subtitle={t('account.unauthenticated.description')} />
      )}

      <div className="w-full max-w-md flex flex-col gap-6">
        {account ? (
          <Button
            style="primary"
            size="md"
            onClick={() => signIn()}
            loading={isAuthenticating}
            className="w-full justify-center"
          >
            {isAuthenticating ? t('common.buttons.authenticating') : t('common.buttons.authenticate_wallet')}
          </Button>
        ) : (
          <ConnectButton style="primary" size="md" className="w-full justify-center" onConnect={signIn} />
        )}

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            {t('account.unauthenticated.benefits.title')}
          </h3>
          <ul className="flex flex-col gap-2">
            <Benefit label={t('account.unauthenticated.benefits.manage_subscription')} />
            <Benefit label={t('account.unauthenticated.benefits.auto_revoke')} />
            <Benefit label={t('account.unauthenticated.benefits.coverage')} />
            <Benefit label={t('account.unauthenticated.benefits.billing')} />
          </ul>
        </div>
      </div>
    </div>
  );
};

const Benefit = ({ label }: { label: string }) => (
  <li className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
    <CheckIcon className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400" />
    {label}
  </li>
);

export default UnauthenticatedView;
