'use client';

import Button from 'components/common/Button';
import Card, { CardTitle } from 'components/common/Card';
import ChainSelect from 'components/common/select/ChainSelect';
import Select from 'components/common/select/Select';
import { usePremiumPlans } from 'lib/hooks/premium/usePremiumPlans';
import { type SubscribeStatus, useSubscribe } from 'lib/hooks/premium/useSubscribe';
import { PREMIUM_PAYMENT_CHAIN_IDS } from 'lib/premium/payment-config';
import type { PremiumSubscription } from 'lib/premium/types';
import { useEffect, useState } from 'react';
import type { Address } from 'viem';
import { useConnection } from 'wagmi';

interface Props {
  account: Address;
  activeSubscription: PremiumSubscription | undefined;
}

const getButtonLabel = (
  activeSubscription: PremiumSubscription | undefined,
  selectedPlanId: string,
  status: SubscribeStatus,
  isDowngrade: boolean,
) => {
  if (status === 'creating') return 'Creating payment';
  if (status === 'paying') return 'Confirm in wallet';
  if (status === 'confirming') return 'Confirming payment';

  if (!activeSubscription) return 'Subscribe';
  if (isDowngrade) return 'Downgrade';
  if (activeSubscription.plan.id === selectedPlanId) return 'Extend';

  return 'Upgrade';
};

const PremiumSubscriptionSection = ({ account, activeSubscription }: Props) => {
  const { chainId } = useConnection();

  const [selectedPlanId, setSelectedPlanId] = useState<string>('individual_annual');
  const [selectedPaymentChainId, setSelectedPaymentChainId] = useState<number>(PREMIUM_PAYMENT_CHAIN_IDS[0]);

  const {
    plans,
    selectedPlan,
    planSelectOptions,
    selectedPlanOption,
    isLoading: isLoadingPlans,
  } = usePremiumPlans(selectedPlanId);

  const { subscribe, isSubscribing, status, error, reset } = useSubscribe({
    ownerAddress: account,
    selectedPlanId,
    selectedPaymentChainId,
    activeSubscriptionId: activeSubscription?.id,
  });

  // Auto-select wallet chain as payment chain if it's supported
  useEffect(() => {
    if (chainId && PREMIUM_PAYMENT_CHAIN_IDS.includes(chainId as (typeof PREMIUM_PAYMENT_CHAIN_IDS)[number])) {
      setSelectedPaymentChainId(chainId);
    }
  }, [chainId]);

  // Reset selected plan if loaded plans don't include it
  useEffect(() => {
    const firstPlanId = plans[0]?.id;
    if (!firstPlanId) return;

    if (!plans.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlanId(firstPlanId);
    }
  }, [plans, selectedPlanId]);

  const isDowngrade = Boolean(
    activeSubscription && selectedPlan && selectedPlan.priceUsd < activeSubscription.plan.priceUsd,
  );
  const buttonLabel = getButtonLabel(activeSubscription, selectedPlanId, status, isDowngrade);

  return (
    <Card header={<CardTitle title="My Premium Subscription" />} className="flex flex-col gap-4">
      {activeSubscription ? (
        <div className="flex flex-col gap-2 rounded-md bg-zinc-100 dark:bg-zinc-800 p-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">{activeSubscription.plan.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">
              Active
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Valid until {activeSubscription.endsAt.slice(0, 10)} · {activeSubscription.slots.used}/
            {activeSubscription.slots.max} address slot{activeSubscription.slots.max === 1 ? '' : 's'} used
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You don&apos;t have an active premium subscription. Subscribe below to get started.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Plan</span>
          <Select
            instanceId="premium-plan-select"
            aria-label="Select plan"
            classNamePrefix="premium-plan-select"
            value={selectedPlanOption}
            options={planSelectOptions}
            onChange={(option) => {
              if (!option) return;
              setSelectedPlanId(option.value);
              if (status === 'failed' || status === 'confirmed') reset();
            }}
            menuPlacement="bottom"
            isSearchable={false}
            isMulti={false}
            isDisabled={isLoadingPlans || isSubscribing}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Payment network</span>
          <div className={isSubscribing ? 'pointer-events-none opacity-60' : undefined}>
            <ChainSelect
              instanceId="premium-payment-chain-select"
              chainIds={[...PREMIUM_PAYMENT_CHAIN_IDS]}
              selected={selectedPaymentChainId}
              onSelect={setSelectedPaymentChainId}
              showNames
            />
          </div>
        </div>
      </div>

      {selectedPlan && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You will pay {selectedPlan.priceUsd} {selectedPlan.tokenSymbol} for {selectedPlan.durationDays} days and up to{' '}
          {selectedPlan.maxAddresses} address
          {selectedPlan.maxAddresses === 1 ? '' : 'es'}.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {status === 'confirmed' ? (
          <span className="text-sm text-green-700 dark:text-green-300">
            Payment confirmed! Your premium subscription is now active.
          </span>
        ) : (
          <Button
            style="primary"
            size="md"
            className="w-fit"
            onClick={status === 'failed' ? reset : subscribe}
            loading={isSubscribing}
            disabled={!selectedPlan || isDowngrade}
          >
            {status === 'failed' ? 'Try again' : buttonLabel}
          </Button>
        )}

        {isDowngrade && <span className="text-sm text-zinc-600 dark:text-zinc-400">Downgrading is not supported.</span>}

        {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
      </div>
    </Card>
  );
};

export default PremiumSubscriptionSection;
