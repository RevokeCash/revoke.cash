'use client';

import AddressSearchBox from 'components/common/AddressSearchBox';
import Button from 'components/common/Button';
import Card, { CardHeader } from 'components/common/Card';
import { useNameLookup } from 'lib/hooks/ethereum/useNameLookup';
import { useSubscriptionAddresses } from 'lib/hooks/premium/useSubscriptionAddresses';
import type { PremiumSubscription } from 'lib/premium/types';
import { parseInputAddress } from 'lib/utils/whois';
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
      <div className="flex flex-col gap-2">
        {activeSubscription.addresses.map((entitledAddress) => (
          <AddressEntryRow
            key={entitledAddress}
            address={entitledAddress}
            isOwner={entitledAddress === activeSubscription.ownerAddress}
            onRemove={() =>
              addresses.removeAddress({ subscriptionId: activeSubscription.id, address: entitledAddress })
            }
            isRemoving={addresses.removingAddress === entitledAddress}
          />
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

interface AddressEntryRowProps {
  address: Address;
  isOwner: boolean;
  onRemove: () => void;
  isRemoving: boolean;
}

const AddressEntryRow = ({ address, isOwner, onRemove, isRemoving }: AddressEntryRowProps) => {
  const t = useTranslations();
  const { domainName } = useNameLookup(address);

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-2">
      <div className="flex items-center gap-1 text-sm min-w-0">
        {domainName && <span className="font-bold shrink-0">{domainName}</span>}
        <span className="font-mono text-zinc-500 dark:text-zinc-400 truncate">{address}</span>
      </div>

      {!isOwner && (
        <Button
          style="tertiary"
          size="sm"
          onClick={onRemove}
          loading={isRemoving}
          aria-label={`${t('common.buttons.remove')} ${domainName ?? address}`}
        >
          {t('common.buttons.remove')}
        </Button>
      )}
    </div>
  );
};

export default PremiumAddressesSection;
