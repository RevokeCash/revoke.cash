'use client';

import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import ActivityTable from 'components/admin/activity/ActivityTable';
import AuditTable from 'components/admin/audit/AuditTable';
import PermissionsCard from 'components/admin/common/PermissionsCard';
import RulesCard from 'components/admin/common/RulesCard';
import CopyButton from 'components/common/CopyButton';
import Href from 'components/common/Href';
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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-mono break-all">{address}</h1>
          <CopyButton content={address} className="text-zinc-500 dark:text-zinc-400" />
        </div>
        <Href
          href={`https://debank.com/profile/${address}`}
          external
          underline="hover"
          className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400"
        >
          debank.com
          <ArrowUpRightIcon className="w-3 h-3" />
        </Href>
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
      <AuditTable
        scope={{ address }}
        title="Audit"
        subtitle="All audit events where this address is the actor or the target"
      />
    </div>
  );
};

export default AddressDiagnostic;
