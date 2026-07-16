'use client';

import type { Delegation } from '@revoke.cash/core/delegations/DelegatePlatform';
import AddressCellWithRiskData from 'components/allowances/dashboard/cells/AddressCellWithRiskData';
import Label from 'components/common/Label';
import { useAddress } from 'lib/hooks/page-context/AddressIdentityContext';
import { useTranslations } from 'next-intl';

interface Props {
  delegation: Delegation;
}

const DelegateCell = ({ delegation }: Props) => {
  const t = useTranslations();
  const { address } = useAddress();

  if (delegation.delegate === address) {
    return (
      <Label className="w-fit bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
        {t('address.delegations.this_wallet')}
      </Label>
    );
  }

  return (
    <AddressCellWithRiskData
      address={delegation.delegate}
      chainId={delegation.chainId}
      ignoredRiskFactors={['eoa', 'uninitialized']}
    />
  );
};

export default DelegateCell;
