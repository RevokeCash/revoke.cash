import Button from 'components/common/Button';
import Input from 'components/common/Input';
import type { useSubscriptionAddresses } from 'lib/hooks/premium/useSubscriptionAddresses';
import type { PremiumSubscription } from 'lib/premium/types';

interface Props {
  subscription: PremiumSubscription;
  addresses: ReturnType<typeof useSubscriptionAddresses>;
}

const SubscriptionCard = ({ subscription, addresses }: Props) => {
  const inputValue = addresses.addressInputs[subscription.id] ?? '';

  return (
    <div className="rounded-md border border-zinc-300 dark:border-zinc-700 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">{subscription.plan.name}</h3>
        {subscription.isActive && (
          <span className="text-xs px-2 py-1 rounded-md bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">
            Active now
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {subscription.startsAt.slice(0, 10)} - {subscription.endsAt.slice(0, 10)} | {subscription.slots.used}/
        {subscription.slots.max} slots used
      </p>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Entitled addresses</span>
        <div className="flex flex-col gap-2">
          {subscription.addresses.map((entitledAddress) => (
            <div
              key={`${subscription.id}-${entitledAddress}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-200 dark:border-zinc-800 px-3 py-2"
            >
              <span className="text-sm font-mono break-all">{entitledAddress}</span>

              {subscription.isActive && entitledAddress !== subscription.ownerAddress && (
                <Button
                  style="tertiary"
                  size="sm"
                  onClick={() => addresses.removeAddress({ subscriptionId: subscription.id, address: entitledAddress })}
                  loading={addresses.isRemovingAddress}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {subscription.isActive && subscription.slots.used < subscription.slots.max && (
        <form
          className="flex flex-col md:flex-row gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!inputValue) return;
            addresses.addAddress({ subscriptionId: subscription.id, address: inputValue });
          }}
        >
          <Input
            size="md"
            placeholder="0x..."
            className="flex-1"
            value={inputValue}
            onChange={(event) => addresses.setAddressInput(subscription.id, event.target.value)}
          />
          <Button style="secondary" size="md" loading={addresses.isAddingAddress}>
            Add address
          </Button>
        </form>
      )}
    </div>
  );
};

export default SubscriptionCard;
