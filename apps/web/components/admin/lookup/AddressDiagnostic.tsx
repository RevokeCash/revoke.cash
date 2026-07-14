'use client';

import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import ActivityTable from 'components/admin/activity/ActivityTable';
import PermissionsCard from 'components/admin/common/PermissionsCard';
import RulesCard from 'components/admin/common/RulesCard';
import CopyButton from 'components/common/CopyButton';
import { useAdminLookup } from 'lib/hooks/admin/useAdminLookup';
import type { Address } from 'viem';
import AddressSubscriptionsCard from './AddressSubscriptionsCard';
import IndexingHealthCard from './IndexingHealthCard';

interface Props {
  address: Address;
}

const AddressDiagnostic = ({ address }: Props) => {
  const { data, isLoading, error } = useAdminLookup(address);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-mono break-all">{address}</h1>
        <CopyButton content={address} className="text-zinc-500 dark:text-zinc-400" />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{parseErrorMessage(error)}</p>}

      <AddressSubscriptionsCard subscriptions={data?.subscriptions} isLoading={isLoading} />
      <PermissionsCard address={address} permissions={data?.permissions} isLoading={isLoading} />
      <RulesCard
        rules={data?.rulesConfig?.effectiveRules}
        source={data?.rulesConfig?.rulesSource}
        isLoading={isLoading}
      />
      <IndexingHealthCard address={address} indexerStates={data?.indexerStates} isLoading={isLoading} />
      <ActivityTable
        scope={{ address }}
        title="Activity"
        subtitle="All auto-revoke actions for this address, including hidden statuses"
      />
    </div>
  );
};

export default AddressDiagnostic;
