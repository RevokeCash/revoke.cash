'use client';

import Button from 'components/common/Button';
import ChainSelect from 'components/common/select/ChainSelect';
import Select from 'components/common/select/Select';
import { usePaymentIntent } from 'lib/hooks/premium/usePaymentIntent';
import { usePremiumPlans } from 'lib/hooks/premium/usePremiumPlans';
import { PREMIUM_PAYMENT_CHAIN_IDS } from 'lib/premium/payment-config';
import { useEffect, useState } from 'react';
import type { Address } from 'viem';
import { useConnection } from 'wagmi';
import PaymentIntentCard from './PaymentIntentCard';

interface Props {
  account: Address;
}

const PremiumPurchaseSection = ({ account }: Props) => {
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

  const {
    activeIntent,
    intentStatus,
    isIntentStatusFetching,
    refreshIntentStatus,
    createIntent,
    isCreatingIntent,
    payIntent,
    isPayingIntent,
  } = usePaymentIntent({ ownerAddress: account, selectedPlanId, selectedPaymentChainId });

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

  return (
    <section className="rounded-lg border border-black dark:border-white p-5 md:p-6 flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Buy or renew premium</h2>

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
            }}
            menuPlacement="bottom"
            isSearchable={false}
            isMulti={false}
            isDisabled={isLoadingPlans || isCreatingIntent}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Payment network</span>
          <div className={isCreatingIntent ? 'pointer-events-none opacity-60' : undefined}>
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

      <div className="flex flex-wrap gap-2">
        <Button
          style="primary"
          size="md"
          className="w-fit"
          onClick={createIntent}
          loading={isCreatingIntent}
          disabled={!selectedPlan}
        >
          Create payment intent
        </Button>

        {activeIntent && (
          <Button
            style="secondary"
            size="md"
            className="w-fit"
            onClick={refreshIntentStatus}
            loading={isIntentStatusFetching}
          >
            Refresh status
          </Button>
        )}
      </div>

      {activeIntent && (
        <PaymentIntentCard
          intent={activeIntent}
          intentStatus={intentStatus}
          onPay={payIntent}
          isPaying={isPayingIntent}
        />
      )}
    </section>
  );
};

export default PremiumPurchaseSection;
