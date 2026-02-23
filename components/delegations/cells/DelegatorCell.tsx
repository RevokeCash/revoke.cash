'use client';
import AddressCell from 'components/allowances/dashboard/cells/AddressCell';
import Label from 'components/common/Label';
import type { Delegation } from 'lib/delegations/DelegatePlatform';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { useTranslations } from 'next-intl';

interface Props {
  delegation: Delegation;
}

const DelegatorCell = ({ delegation }: Props) => {
  const t = useTranslations();
  const { address } = useAddress();

  if (delegation.delegator === address) {
    return (
      <Label className="w-fit bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
        {t('address.delegations.this_wallet')}
      </Label>
    );
  }

  return <AddressCell address={delegation.delegator} chainId={delegation.chainId} />;
};

export default DelegatorCell;
