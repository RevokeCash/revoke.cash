'use client';

import { DialogTitle } from '@headlessui/react';
import { DAY, formatDate } from '@revoke.cash/core/utils/time';
import Button from 'components/common/Button';
import Input from 'components/common/Input';
import Modal from 'components/common/Modal';
import SegmentedControl from 'components/common/SegmentedControl';
import { useGrantSubscription } from 'lib/hooks/admin/useAdminSubscriptions';
import { usePremiumPlans } from 'lib/hooks/premium/usePremiumPlans';
import { useState } from 'react';
import type { Address } from 'viem';

const DURATION_PRESET_DAYS = [30, 90, 365];
const MAX_DURATION_DAYS = 3650;

interface Props {
  ownerAddress: Address;
  currentPlanId?: string;
  currentEndsAt?: string;
}

// Grants complimentary subscription time to the owner address by creating a $0 payment with no
// on-chain transfer. Works both for extending an existing subscription and starting a new one.
const GrantSubscriptionButton = ({ ownerAddress, currentPlanId, currentEndsAt }: Props) => {
  const [open, setOpen] = useState(false);
  const [chosenPlanId, setChosenPlanId] = useState<string>();
  const [durationInput, setDurationInput] = useState('365');
  const [reason, setReason] = useState('');
  const { plans } = usePremiumPlans(chosenPlanId ?? currentPlanId ?? '');
  const grantMutation = useGrantSubscription();

  const selectedPlanId = chosenPlanId ?? currentPlanId ?? plans[0]?.id;
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);
  const currentPlan = plans.find((plan) => plan.id === currentPlanId);

  const durationDays = Number.parseInt(durationInput, 10);
  const hasValidDuration = Number.isInteger(durationDays) && durationDays >= 1 && durationDays <= MAX_DURATION_DAYS;

  // Mirrors the payment replay: an active period is extended from its end, an expired or missing
  // one starts fresh from now
  const activeUntil = currentEndsAt ? new Date(currentEndsAt).getTime() : 0;
  const newEndsAt = hasValidDuration ? new Date(Math.max(Date.now(), activeUntil) + durationDays * DAY) : null;
  const upgradesRemainingPeriod = Boolean(
    activeUntil > Date.now() &&
      currentPlan &&
      selectedPlan &&
      selectedPlan.id !== currentPlan.id &&
      selectedPlan.priceUsdCents > currentPlan.priceUsdCents,
  );

  const handleGrant = () => {
    if (!selectedPlan || !hasValidDuration) return;

    grantMutation.mutate(
      {
        ownerAddress,
        planId: selectedPlan.id,
        durationDays,
        reason: reason.trim() || undefined,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <>
      <Button style="secondary" size="sm" onClick={() => setOpen(true)}>
        Grant time
      </Button>
      <Modal open={open} setOpen={setOpen} className="sm:max-w-lg">
        <div className="flex flex-col gap-4">
          <div>
            <DialogTitle className="text-lg font-bold">Grant subscription time</DialogTitle>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Creates a complimentary $0 payment with no on-chain transfer, extending the owner's subscription or
              starting a new one.
            </p>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Owner</span>
            <span className="font-mono break-all">{ownerAddress}</span>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Plan</span>
            <div>
              <SegmentedControl
                options={plans.map((plan) => ({ value: plan.id, label: plan.name }))}
                value={selectedPlanId ?? ''}
                onChange={setChosenPlanId}
                disabled={plans.length === 0}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Duration (days)</span>
            <div className="flex items-center gap-2">
              <Input
                size="md"
                type="number"
                min={1}
                max={MAX_DURATION_DAYS}
                value={durationInput}
                onChange={(event) => setDurationInput(event.target.value)}
                aria-label="Duration in days"
                className="w-28"
              />
              {DURATION_PRESET_DAYS.map((presetDays) => (
                <Button
                  key={presetDays}
                  style="secondary"
                  size="sm"
                  onClick={() => setDurationInput(String(presetDays))}
                >
                  {presetDays}d
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Reason (stored on the payment and audit event)</span>
            <Input
              size="md"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              placeholder="e.g. bug report reward"
              aria-label="Grant reason"
            />
          </div>

          <div className="flex flex-col gap-1 text-sm">
            {newEndsAt && selectedPlan && (
              <p>
                Grants <span className="font-medium">{durationDays} days</span> of{' '}
                <span className="font-medium">{selectedPlan.name}</span>; the subscription will end on{' '}
                <span className="font-medium">{formatDate(newEndsAt.toISOString())}</span>.
              </p>
            )}
            {upgradesRemainingPeriod && (
              <p className="text-amber-600 dark:text-amber-400">
                The higher-priced plan also upgrades the entire remaining subscription period to {selectedPlan?.name}.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button style="secondary" size="md" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              style="primary"
              size="md"
              onClick={handleGrant}
              loading={grantMutation.isPending}
              disabled={!selectedPlan || !hasValidDuration}
            >
              Grant
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default GrantSubscriptionButton;
