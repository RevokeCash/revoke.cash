'use client';

import AddressRow from 'components/account/AddressRow';
import StatusLabel from 'components/common/StatusLabel';
import { useTranslations } from 'next-intl';
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

  const status = grantedCount === 0 ? 'neutral' : grantedCount === totalCount ? 'success' : 'warning';

  return (
    <div className="min-w-0 flex-1">
      <AddressRow address={address}>
        <StatusLabel status={status} className="whitespace-nowrap">
          <span className="sm:hidden">
            {grantedCount}/{totalCount}
          </span>
          <span className="hidden sm:inline">{summaryLabel}</span>
        </StatusLabel>
      </AddressRow>
    </div>
  );
};

export default AutoRevokePermissionSummary;
