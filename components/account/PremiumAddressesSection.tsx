'use client';

import Button from 'components/common/Button';
import Card, { CardHeader } from 'components/common/Card';
import Input from 'components/common/Input';
import { useSubscriptionAddresses } from 'lib/hooks/premium/useSubscriptionAddresses';
import type { PremiumSubscription } from 'lib/premium/types';
import type { Address } from 'viem';

interface Props {
  activeSubscription: PremiumSubscription;
  account: Address;
}

const PremiumAddressesSection = ({ activeSubscription, account }: Props) => {
  const addresses = useSubscriptionAddresses(account);
  const inputValue = addresses.addressInputs[activeSubscription.id] ?? '';

  const header = (
    <CardHeader>
      <div className="flex items-center w-full justify-between">
        <h2 className="text-xl flex gap-2 items-center">My Premium Addresses</h2>
        <p className="text-xs italic font-normal">
          {`${activeSubscription.slots.used}/${activeSubscription.slots.max} slot${activeSubscription.slots.max === 1 ? '' : 's'} used`}
        </p>
      </div>
    </CardHeader>
  );

  return (
    <Card header={header} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {activeSubscription.addresses.map((entitledAddress) => (
          <div
            key={entitledAddress}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-2"
          >
            <span className="text-sm font-mono break-all">{entitledAddress}</span>

            {entitledAddress !== activeSubscription.ownerAddress && (
              <Button
                style="tertiary"
                size="sm"
                onClick={() =>
                  addresses.removeAddress({ subscriptionId: activeSubscription.id, address: entitledAddress })
                }
                loading={addresses.isRemovingAddress}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      {activeSubscription.slots.used < activeSubscription.slots.max && (
        <form
          className="flex flex-col md:flex-row gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!inputValue) return;
            addresses.addAddress({ subscriptionId: activeSubscription.id, address: inputValue });
          }}
        >
          <Input
            size="md"
            placeholder="0x..."
            className="flex-1"
            value={inputValue}
            onChange={(event) => addresses.setAddressInput(activeSubscription.id, event.target.value)}
          />
          <Button style="secondary" size="md" loading={addresses.isAddingAddress}>
            Add address
          </Button>
        </form>
      )}
    </Card>
  );
};

export default PremiumAddressesSection;
