'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import Card, { CardTitle } from 'components/common/Card';
import CardSelect, { type CardSelectOption } from 'components/common/CardSelect';
import Label from 'components/common/Label';
import ChainSelect from 'components/common/select/ChainSelect';
import { useNameLookup } from 'lib/hooks/ethereum/useNameLookup';
import { usePremiumPlans } from 'lib/hooks/premium/usePremiumPlans';
import { type SubscribeStatus, useSubscribe } from 'lib/hooks/premium/useSubscribe';
import { PREMIUM_PAYMENT_CHAIN_IDS } from 'lib/premium/payment-config';
import type { PremiumPlan, PremiumSubscription } from 'lib/premium/types';
import { shortenAddress } from 'lib/utils/formatting';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import type { Address } from 'viem';
import { useConnection } from 'wagmi';

interface Props {
  account: Address;
  activeSubscription: PremiumSubscription | undefined;
}

const PremiumSubscriptionSection = ({ account, activeSubscription }: Props) => {
  const t = useTranslations();
  const { chainId } = useConnection();
  const { domainName } = useNameLookup(account);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(activeSubscription?.plan.id ?? 'individual_annual');
  const [selectedPaymentChainId, setSelectedPaymentChainId] = useState<number>(PREMIUM_PAYMENT_CHAIN_IDS[0]);

  const { plans, selectedPlan, isLoading: isLoadingPlans, isError: isPlansError } = usePremiumPlans(selectedPlanId);

  const planCardOptions = usePlanCardOptions(plans, activeSubscription);

  const { subscribe, isSubscribing, status, error, reset } = useSubscribe({
    ownerAddress: account,
    selectedPlanId,
    selectedPaymentChainId,
  });

  // Auto-select wallet chain as payment chain if it's supported
  useEffect(() => {
    if (chainId && PREMIUM_PAYMENT_CHAIN_IDS.includes(chainId as (typeof PREMIUM_PAYMENT_CHAIN_IDS)[number])) {
      setSelectedPaymentChainId(chainId);
    }
  }, [chainId]);

  // Sync selected plan when active subscription loads
  useEffect(() => {
    if (activeSubscription?.plan.id) {
      setSelectedPlanId(activeSubscription.plan.id);
    }
  }, [activeSubscription?.plan.id]);

  // Reset selected plan if loaded plans don't include it
  useEffect(() => {
    const firstPlanId = plans[0]?.id;
    if (!firstPlanId) return;

    if (selectedPlanId !== 'free' && !plans.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlanId(firstPlanId);
    }
  }, [plans, selectedPlanId]);

  const isFreeSelected = selectedPlanId === 'free';
  const action = !activeSubscription
    ? 'subscribe'
    : activeSubscription.plan.id === selectedPlanId
      ? 'extend'
      : 'upgrade';

  return (
    <Card
      header={<CardTitle title={t('account.subscription.title')} />}
      isLoading={isLoadingPlans}
      className={twMerge('flex flex-col gap-4', isLoadingPlans && 'h-80')}
    >
      <WalletInfo account={account} domainName={domainName} />
      <SubscriptionBanner activeSubscription={activeSubscription} />

      {isPlansError ? (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 shrink-0 text-yellow-500" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.subscription.plans_unavailable')}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.subscription.plan')}</span>
            <CardSelect
              options={planCardOptions}
              value={selectedPlanId}
              onChange={(value) => {
                setSelectedPlanId(value);
                if (status === 'failed' || status === 'confirmed') reset();
              }}
              disabled={isLoadingPlans || isSubscribing}
            />
          </div>

          {selectedPlan && !isFreeSelected && (
            <PaymentForm
              selectedPlan={selectedPlan}
              selectedPaymentChainId={selectedPaymentChainId}
              onSelectPaymentChainId={setSelectedPaymentChainId}
              action={action}
              status={status}
              error={error}
              isSubscribing={isSubscribing}
              onSubscribe={subscribe}
              onReset={reset}
            />
          )}
        </>
      )}
    </Card>
  );
};

export default PremiumSubscriptionSection;

const WalletInfo = ({ account, domainName }: { account: Address; domainName: string | null | undefined }) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.subscription.wallet')}</span>
      <span className="font-medium">{domainName ?? shortenAddress(account, 4)}</span>
      {domainName && <span className="text-sm font-mono break-all text-zinc-600 dark:text-zinc-400">{account}</span>}
    </div>
  );
};

const SubscriptionBanner = ({ activeSubscription }: { activeSubscription: PremiumSubscription | undefined }) => {
  const t = useTranslations();

  if (!activeSubscription) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.subscription.no_subscription')}</p>;
  }

  return (
    <div className="flex flex-col gap-2 rounded-md bg-zinc-100 dark:bg-zinc-800 p-4">
      <div className="flex items-center gap-2">
        <span className="font-medium">{activeSubscription.plan.name}</span>
        <Label className="bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">
          {t('account.subscription.active')}
        </Label>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t('account.subscription.valid_until', { date: activeSubscription.endsAt.slice(0, 10) })} ·{' '}
        {t('account.subscription.slots_summary', {
          used: activeSubscription.slots.used,
          max: activeSubscription.slots.max,
        })}
      </p>
    </div>
  );
};

interface PaymentFormProps {
  selectedPlan: PremiumPlan;
  selectedPaymentChainId: number;
  onSelectPaymentChainId: (chainId: number) => void;
  action: 'subscribe' | 'extend' | 'upgrade';
  status: SubscribeStatus;
  error: string | null | undefined;
  isSubscribing: boolean;
  onSubscribe: () => void;
  onReset: () => void;
}

const PaymentForm = ({
  selectedPlan,
  selectedPaymentChainId,
  onSelectPaymentChainId,
  action,
  status,
  error,
  isSubscribing,
  onSubscribe,
  onReset,
}: PaymentFormProps) => {
  const t = useTranslations();

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{t('account.subscription.payment_network')}</span>
        <div className={isSubscribing ? 'pointer-events-none opacity-60' : undefined}>
          <ChainSelect
            instanceId="premium-payment-chain-select"
            chainIds={[...PREMIUM_PAYMENT_CHAIN_IDS]}
            selected={selectedPaymentChainId}
            onSelect={onSelectPaymentChainId}
            showNames
          />
        </div>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t('account.subscription.payment_summary', {
          amount: selectedPlan.priceUsd,
          token: selectedPlan.tokenSymbol,
          days: selectedPlan.durationDays,
          maxAddresses: selectedPlan.maxAddresses,
        })}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {status === 'confirmed' ? (
          <span className="text-sm text-green-700 dark:text-green-300">
            {t('account.subscription.payment_confirmed')}
          </span>
        ) : (
          <Button
            style="primary"
            size="md"
            className="w-fit"
            onClick={() => {
              if (status === 'failed') onReset();
              onSubscribe();
            }}
            loading={isSubscribing}
          >
            {t(`account.subscription.buttons.${status === 'failed' ? 'try_again' : isSubscribing ? status : action}`)}
          </Button>
        )}

        {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
      </div>
    </>
  );
};

const usePlanCardOptions = (
  plans: PremiumPlan[],
  activeSubscription: PremiumSubscription | undefined,
): CardSelectOption<string>[] => {
  const t = useTranslations();

  const currentPlanId = activeSubscription?.plan.id;
  const currentPlanPriceUsd = activeSubscription?.plan.priceUsd ?? 0;

  return useMemo<CardSelectOption<string>[]>(() => {
    const isDowngrade = (priceUsd: number) => Boolean(activeSubscription && priceUsd < currentPlanPriceUsd);
    const downgradeTooltip = t('account.subscription.downgrade_not_supported');

    const freeOption: CardSelectOption<string> = {
      value: 'free',
      label: t('account.subscription.plan_options.free'),
      description: t('account.subscription.plan_options.basic_access'),
      tag: !currentPlanId ? t('account.subscription.plan_options.current') : undefined,
      disabled: Boolean(activeSubscription),
      tooltip: activeSubscription ? downgradeTooltip : undefined,
    };

    const premiumOptions = plans.map((plan) => ({
      value: plan.id,
      label: plan.name,
      description: t('account.subscription.plan_description', {
        price: plan.priceUsd,
        maxAddresses: plan.maxAddresses,
      }),
      tag: plan.id === currentPlanId ? t('account.subscription.plan_options.current') : undefined,
      disabled: isDowngrade(plan.priceUsd),
      tooltip: isDowngrade(plan.priceUsd) ? downgradeTooltip : undefined,
    }));

    return [freeOption, ...premiumOptions];
  }, [plans, currentPlanId, activeSubscription, currentPlanPriceUsd, t]);
};
