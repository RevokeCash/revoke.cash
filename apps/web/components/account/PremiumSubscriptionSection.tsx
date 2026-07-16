'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CRISP_WEBSITE_ID, DISCORD_URL } from '@revoke.cash/core/constants';
import { PREMIUM_PAYMENT_CHAIN_IDS } from '@revoke.cash/core/premium/payment-config';
import { isUltimatePlan } from '@revoke.cash/core/premium/plans';
import type { PremiumEntitlement, PremiumPlan, PremiumSubscription } from '@revoke.cash/core/premium/types';
import { isNullish } from '@revoke.cash/core/utils';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import { DAY } from '@revoke.cash/core/utils/time';
import Button from 'components/common/Button';
import Card, { CardTitle } from 'components/common/Card';
import CardSelect, { type CardSelectOption } from 'components/common/CardSelect';
import Href from 'components/common/Href';
import StatusLabel from 'components/common/StatusLabel';
import ChainSelect from 'components/common/select/ChainSelect';
import { Crisp } from 'crisp-sdk-web';
import { useErc7715Support } from 'lib/hooks/auto-revoke/useErc7715Support';
import { useNameLookup } from 'lib/hooks/ethereum/useNameLookup';
import { usePremiumPlans } from 'lib/hooks/premium/usePremiumPlans';
import { type SubscribeStatus, useSubscribe } from 'lib/hooks/premium/useSubscribe';
import analytics from 'lib/utils/analytics';
import { getCancellationRefund, hasPendingRefundRequest } from 'lib/utils/cancellation';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import type { Address } from 'viem';
import { useConnection } from 'wagmi';

interface Props {
  account: Address;
  activeSubscription: PremiumSubscription | undefined;
  expiredSubscription: PremiumSubscription | undefined;
  entitlements: PremiumEntitlement[];
}

const PremiumSubscriptionSection = ({ account, activeSubscription, expiredSubscription, entitlements }: Props) => {
  const t = useTranslations();
  const { chainId } = useConnection();
  const { domainName } = useNameLookup(account);
  const preselectedTier = useSearchParams()?.get('plan');

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    activeSubscription?.plan.id ?? expiredSubscription?.plan.id ?? 'premium_annual',
  );
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

  // Preselect the tier chosen on the pricing page once the plans load
  useEffect(() => {
    if (!preselectedTier) return;

    const preselectedPlan = plans.find((plan) => plan.tier === preselectedTier);
    if (preselectedPlan) {
      setSelectedPlanId(preselectedPlan.id);
    }
  }, [preselectedTier, plans]);

  // Sync selected plan when subscription data loads, unless the pricing page chose a tier
  useEffect(() => {
    if (preselectedTier) return;

    const subscribedPlanId = activeSubscription?.plan.id ?? expiredSubscription?.plan.id;
    if (subscribedPlanId) {
      setSelectedPlanId(subscribedPlanId);
    }
  }, [activeSubscription?.plan.id, expiredSubscription?.plan.id, preselectedTier]);

  // Reset selected plan if loaded plans don't include it
  useEffect(() => {
    const firstPlanId = plans[0]?.id;
    if (!firstPlanId) return;

    if (selectedPlanId !== 'free' && !plans.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlanId(firstPlanId);
    }
  }, [plans, selectedPlanId]);

  const isFreeSelected = selectedPlanId === 'free';

  const getActionLabel = (): 'subscribe' | 'renew' | 'extend' | 'upgrade' => {
    if (activeSubscription) {
      if (activeSubscription.plan.id === selectedPlanId) return 'extend';
      return 'upgrade';
    }

    if (expiredSubscription?.plan.id === selectedPlanId) return 'renew';
    return 'subscribe';
  };

  const actionLabel = getActionLabel();

  return (
    <Card
      header={<CardTitle title={t('account.subscription.title')} />}
      isLoading={isLoadingPlans}
      className={twMerge('flex flex-col gap-4', isLoadingPlans && 'h-80')}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0 flex flex-col gap-4">
          <WalletInfo account={account} domainName={domainName} />
          <SubscriptionBannerSection
            activeSubscription={activeSubscription}
            expiredSubscription={expiredSubscription}
            entitlements={entitlements}
          />
        </div>

        <div className="min-w-0 flex flex-col gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-4 lg:border-t-0 lg:pt-0 lg:border-l lg:pl-6">
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
                  action={actionLabel}
                  status={status}
                  error={error}
                  isSubscribing={isSubscribing}
                  onSubscribe={subscribe}
                  onReset={reset}
                />
              )}
            </>
          )}
        </div>
      </div>
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
      <span className="text-sm font-mono break-all text-zinc-600 dark:text-zinc-400">{account}</span>
    </div>
  );
};

interface SubscriptionBannerSectionProps {
  activeSubscription: PremiumSubscription | undefined;
  expiredSubscription: PremiumSubscription | undefined;
  entitlements: PremiumEntitlement[];
}

const SubscriptionBannerSection = ({
  activeSubscription,
  expiredSubscription,
  entitlements,
}: SubscriptionBannerSectionProps) => {
  const t = useTranslations();

  const grantedEntitlements = entitlements.filter(
    (entitlement) => entitlement.ownerAddress.toLowerCase() !== activeSubscription?.ownerAddress?.toLowerCase(),
  );

  if (!activeSubscription && !expiredSubscription && grantedEntitlements.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t.rich('account.subscription.no_subscription', {
          'premium-link': (chunks) => (
            <Href href="/premium" router underline="always">
              {chunks}
            </Href>
          ),
        })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {activeSubscription && (
        <SubscriptionBanner
          planName={activeSubscription.plan.name}
          endsAt={activeSubscription.endsAt}
          slots={activeSubscription.slots}
          cancellationRequested={hasPendingRefundRequest(activeSubscription.payments)}
        />
      )}
      {!activeSubscription && expiredSubscription && <ExpiredSubscriptionBanner subscription={expiredSubscription} />}
      {grantedEntitlements.map((entitlement) => (
        <SubscriptionBanner
          key={entitlement.ownerAddress}
          planName={entitlement.planName}
          endsAt={entitlement.endsAt}
          grantedBy={entitlement.ownerAddress}
        />
      ))}
      {!activeSubscription && !expiredSubscription && grantedEntitlements.length > 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t('account.subscription.optional_own_subscription')}
        </p>
      )}
    </div>
  );
};

interface SubscriptionBannerProps {
  planName: string;
  endsAt: string;
  grantedBy?: Address;
  slots?: { used: number; max: number };
  cancellationRequested?: boolean;
}

const EXPIRY_WARNING_DAYS = 30;

const SubscriptionBanner = ({ planName, endsAt, grantedBy, slots, cancellationRequested }: SubscriptionBannerProps) => {
  const t = useTranslations();

  const daysUntilExpiry = Math.max(Math.ceil((new Date(endsAt).getTime() - Date.now()) / DAY), 0);
  const isExpiringSoon = daysUntilExpiry <= EXPIRY_WARNING_DAYS;

  const bannerStrings = [
    grantedBy && t('account.subscription.granted_by', { address: shortenAddress(grantedBy, 4) }),
    isExpiringSoon
      ? t('account.subscription.expires_in', { days: daysUntilExpiry, date: endsAt.slice(0, 10) })
      : t('account.subscription.valid_until', { date: endsAt.slice(0, 10) }),
    slots && t('account.subscription.slots_summary', { used: slots.used, max: slots.max }),
  ];

  const bannerClasses = isExpiringSoon
    ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900'
    : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900';

  return (
    <div className={twMerge('flex flex-col gap-2 rounded-md p-4 border', bannerClasses)}>
      <div className="flex items-center gap-2">
        <span className="font-medium">{planName}</span>
        <StatusLabel status={isExpiringSoon ? 'warning' : 'success'}>
          {isExpiringSoon ? t('account.subscription.expires_soon') : t('account.subscription.active')}
        </StatusLabel>
        {cancellationRequested && (
          <StatusLabel status="warning">{t('account.subscription.cancellation.requested')}</StatusLabel>
        )}
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{bannerStrings.filter(Boolean).join(' • ')}</p>
    </div>
  );
};

const ExpiredSubscriptionBanner = ({ subscription }: { subscription: PremiumSubscription }) => {
  const t = useTranslations();

  // A subscription whose latest payment was refunded ended by cancellation, not by running out
  const cancellationRefund = getCancellationRefund(subscription.payments);

  const bannerStrings = [
    cancellationRefund
      ? t('account.subscription.cancellation.cancelled_on', { date: cancellationRefund.processedAt.slice(0, 10) })
      : t('account.subscription.expired_on', { date: subscription.endsAt.slice(0, 10) }),
    isUltimatePlan(subscription.plan) && t('account.subscription.expired_ultimate_stopped'),
    t('account.subscription.expired_preserved'),
  ];

  return (
    <div className="flex flex-col gap-2 rounded-md bg-yellow-50 dark:bg-yellow-950/20 p-4 border border-yellow-200 dark:border-yellow-900">
      <div className="flex items-center gap-2">
        <span className="font-medium">{subscription.plan.name}</span>
        <StatusLabel status="warning">
          {cancellationRefund ? t('account.subscription.cancellation.cancelled') : t('account.subscription.expired')}
        </StatusLabel>
        {hasPendingRefundRequest(subscription.payments) && (
          <StatusLabel status="warning">{t('account.subscription.cancellation.requested')}</StatusLabel>
        )}
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{bannerStrings.filter(Boolean).join(' ')}</p>
    </div>
  );
};

interface PaymentFormProps {
  selectedPlan: PremiumPlan;
  selectedPaymentChainId: number;
  onSelectPaymentChainId: (chainId: number) => void;
  action: 'subscribe' | 'renew' | 'extend' | 'upgrade';
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
  const { supportsErc7715 } = useErc7715Support();

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
          amount: selectedPlan.priceUsdCents / 100,
          token: selectedPlan.tokenSymbol,
          days: selectedPlan.durationDays,
          maxAddresses: selectedPlan.maxAddresses,
        })}
      </p>

      {isUltimatePlan(selectedPlan) && !supportsErc7715 && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 shrink-0 text-yellow-500" />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t('account.subscription.ultimate_requires_metamask')}
          </p>
        </div>
      )}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {t.rich('account.subscription.legal_notice', {
          'terms-link': (children) => (
            <Href href="/terms" router underline="always">
              {children}
            </Href>
          ),
        })}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {status === 'confirmed' ? (
          <>
            <span className="text-sm text-green-700 dark:text-green-300">
              {t('account.subscription.payment_confirmed')}
            </span>
            {isUltimatePlan(selectedPlan) && (
              <Href href="/account/auto-revoke" router underline="always" className="text-sm">
                {t('account.subscription.next_setup_auto_revoke')} →
              </Href>
            )}
          </>
        ) : (
          <Button
            style="primary"
            size="md"
            className="w-fit"
            onClick={() => {
              analytics.track('Subscribe Clicked', {
                planId: selectedPlan.id,
                chainId: selectedPaymentChainId,
                action,
              });
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

      {status === 'failed' && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t.rich('account.subscription.payment_help', {
            'support-link': (children) =>
              isNullish(CRISP_WEBSITE_ID) ? (
                <Href href={DISCORD_URL} external underline="always">
                  {children}
                </Href>
              ) : (
                <button
                  type="button"
                  onClick={() => Crisp.chat.open()}
                  className="cursor-pointer underline hover:underline decoration-brand"
                >
                  {children}
                </button>
              ),
          })}
        </p>
      )}
    </>
  );
};

const usePlanCardOptions = (
  plans: PremiumPlan[],
  activeSubscription: PremiumSubscription | undefined,
): CardSelectOption<string>[] => {
  const t = useTranslations();

  const currentPlanId = activeSubscription?.plan.id;
  const currentPlanPriceUsdCents = activeSubscription?.plan.priceUsdCents ?? 0;

  return useMemo<CardSelectOption<string>[]>(() => {
    const isDowngrade = (priceUsdCents: number) =>
      Boolean(activeSubscription && priceUsdCents < currentPlanPriceUsdCents);
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
        price: plan.priceUsdCents / 100,
        maxAddresses: plan.maxAddresses,
      }),
      tag: plan.id === currentPlanId ? t('account.subscription.plan_options.current') : undefined,
      disabled: isDowngrade(plan.priceUsdCents),
      tooltip: isDowngrade(plan.priceUsdCents) ? downgradeTooltip : undefined,
    }));

    return [freeOption, ...premiumOptions];
  }, [plans, currentPlanId, activeSubscription, currentPlanPriceUsdCents, t]);
};
