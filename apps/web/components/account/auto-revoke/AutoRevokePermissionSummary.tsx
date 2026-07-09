'use client';

import AddressRow from 'components/account/AddressRow';
import Label from 'components/common/Label';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import type { Address } from 'viem';

interface Props {
  address: Address;
  grantedCount: number;
  totalCount: number;
}

const AutoRevokePermissionSummary = ({ address, grantedCount, totalCount }: Props) => {
  const t = useTranslations();

  const summaryLabel = t('account.auto_revoke.permissions.networks_enabled', {
    enabled: grantedCount,
    total: totalCount,
  });

  const labelClassName = twMerge(
    'whitespace-nowrap',
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    grantedCount === 0 && 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
    grantedCount === totalCount && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  );

  return (
    <div className="min-w-0 flex-1">
      <AddressRow address={address}>
        <Label className={labelClassName}>
          <span className="sm:hidden">
            {grantedCount}/{totalCount}
          </span>
          <span className="hidden sm:inline">{summaryLabel}</span>
        </Label>
      </AddressRow>
    </div>
  );
};

export default AutoRevokePermissionSummary;
