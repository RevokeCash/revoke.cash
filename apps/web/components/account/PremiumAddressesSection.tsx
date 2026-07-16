'use client';

import type { PremiumSubscription } from '@revoke.cash/core/premium/types';
import { parseInputAddress } from '@revoke.cash/core/whois';
import AddressRow from 'components/account/AddressRow';
import AddressSearchBox from 'components/common/AddressSearchBox';
import Button from 'components/common/Button';
import Card, { CardHeader } from 'components/common/Card';
import { useSubscriptionAddresses } from 'lib/hooks/premium/useSubscriptionAddresses';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import type { Address } from 'viem';

interface Props {
  activeSubscription: PremiumSubscription;
  account: Address;
}

const PremiumAddressesSection = ({ activeSubscription, account }: Props) => {
  const t = useTranslations();
  const addresses = useSubscriptionAddresses(account);
  const inputValue = addresses.addressInputs[activeSubscription.id] ?? '';

  const handleSubmit = async () => {
    if (!inputValue) return;

    try {
      const resolvedAddress = await parseInputAddress(inputValue);
      if (!resolvedAddress) {
        toast.error(t('account.addresses.resolve_failed'));
        return;
      }
      addresses.addAddress({ subscriptionId: activeSubscription.id, address: resolvedAddress });
    } catch {
      toast.error(t('account.addresses.resolve_failed'));
    }
  };

  const header = (
    <CardHeader>
      <div className="flex items-center w-full justify-between">
        <h2 className="text-xl flex gap-2 items-center">{t('account.addresses.title')}</h2>
        <p className="text-xs italic font-normal">
          {t('account.subscription.slots_summary', {
            used: activeSubscription.slots.used,
            max: activeSubscription.slots.max,
          })}
        </p>
      </div>
    </CardHeader>
  );

  return (
    <Card header={header} className="flex flex-col gap-4">
      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {activeSubscription.addresses.map((entitledAddress) => (
          <AddressRow key={entitledAddress} address={entitledAddress}>
            {entitledAddress !== activeSubscription.ownerAddress && (
              <Button
                style="tertiary"
                size="sm"
                onClick={() =>
                  addresses.removeAddress({ subscriptionId: activeSubscription.id, address: entitledAddress })
                }
                loading={addresses.removingAddress === entitledAddress}
              >
                {t('common.buttons.remove')}
              </Button>
            )}
          </AddressRow>
        ))}
      </div>

      {activeSubscription.slots.used < activeSubscription.slots.max && (
        <div className="flex flex-col sm:flex-row gap-2">
          <AddressSearchBox
            onSubmit={handleSubmit}
            onChange={(event) => addresses.setAddressInput(activeSubscription.id, event.target.value)}
            value={inputValue}
            placeholder={t('account.addresses.placeholder')}
            className="grow"
          />
          <Button style="secondary" size="md" onClick={handleSubmit} loading={addresses.isAddingAddress}>
            {t('account.addresses.add_address')}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default PremiumAddressesSection;
