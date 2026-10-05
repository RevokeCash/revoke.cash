'use client';

import { AUTO_REVOKE_SUPPORTED_CHAINS } from '@revoke.cash/core/auto-revoke/config';
import type { AutoRevokePermission } from '@revoke.cash/core/auto-revoke/permissions';
import { getChainName } from '@revoke.cash/core/chains';
import type { Nullable } from '@revoke.cash/core/types';
import { createColumnHelper } from '@tanstack/react-table';
import Button from 'components/common/Button';
import Card, { CardTitle } from 'components/common/Card';
import ChainLogo from 'components/common/ChainLogo';
import StatusLabel from 'components/common/StatusLabel';
import TimeAgo from 'components/common/TimeAgo';
import Table from 'components/common/table/Table';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { type OnChainPermissionCheck, useOnChainPermissionCheck } from 'lib/hooks/admin/useAdminLookup';
import { useTable } from 'lib/hooks/useTable';
import type { AppTableFeatures } from 'lib/utils/table';
import { useMemo } from 'react';
import type { Address } from 'viem';
import AdminAddressLink from './AdminAddressLink';

// Address scope shows one row per supported chain for a single wallet (missing chains included);
// permissions scope shows one row per granted permission across multiple wallets
interface Props {
  address?: Address;
  permissions?: AutoRevokePermission[];
  isLoading?: boolean;
  error?: Nullable<Error>;
}

interface PermissionRow {
  address: Address;
  chainId: number;
  permission?: AutoRevokePermission;
}

const columnHelper = createColumnHelper<AppTableFeatures, PermissionRow>();

const columns = columnHelper.columns([
  columnHelper.accessor('chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => (
      <div className="flex items-center gap-2 py-2 pr-4">
        <ChainLogo chainId={info.getValue()} size={20} />
        {getChainName(info.getValue())}
      </div>
    ),
  }),
  columnHelper.accessor('address', {
    id: 'wallet',
    header: 'Wallet',
    cell: (info) => (
      <div className="py-2 pr-4">
        <AdminAddressLink address={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('permission', {
    id: 'databaseState',
    header: 'Database state',
    cell: (info) => {
      const permission = info.getValue();
      const label = !permission ? 'Missing' : permission.isActive ? 'Active' : 'Expired';

      return (
        <div className="flex items-center gap-2 py-2 pr-4">
          <StatusLabel status={permission?.isActive ? 'success' : 'neutral'} className="py-0.75">
            {label}
          </StatusLabel>
          {permission?.isActive && !permission.accountUpgraded && <NotUpgradedLabel />}
        </div>
      );
    },
  }),
  columnHelper.accessor('permission', {
    id: 'expires',
    header: 'Expires',
    cell: (info) => {
      const permission = info.getValue();

      return (
        <div className="py-2 pr-4">
          {permission ? (
            <WithHoverTooltip tooltip={permission.expiresAt}>
              <span>
                <TimeAgo datetime={new Date(permission.expiresAt)} />
              </span>
            </WithHoverTooltip>
          ) : (
            <span className="text-zinc-500">-</span>
          )}
        </div>
      );
    },
  }),
  columnHelper.display({
    id: 'onChain',
    header: 'On-chain',
    cell: (info) => (
      <OnChainCell
        address={info.row.original.address}
        chainId={info.row.original.chainId}
        permission={info.row.original.permission}
      />
    ),
  }),
]);

const PermissionsCard = ({ address, permissions, isLoading, error }: Props) => {
  const isAddressScope = address !== undefined;

  const subtitle = isAddressScope
    ? 'Auto-revoke delegation state per supported chain'
    : 'Auto-revoke delegations granted by the covered addresses';

  const rows: PermissionRow[] = useMemo(() => {
    if (!permissions) return [];

    if (isAddressScope) {
      return AUTO_REVOKE_SUPPORTED_CHAINS.map((chainId) => ({
        address,
        chainId,
        permission: permissions.find((permission) => permission.chainId === chainId),
      }));
    }

    return permissions.map((permission) => ({
      address: permission.address,
      chainId: permission.chainId,
      permission,
    }));
  }, [address, isAddressScope, permissions]);

  const table = useTable({
    data: rows,
    columns,
    getRowId: (row) => `${row.address}-${row.chainId}`,
    columnVisibility: { wallet: !isAddressScope },
    pageSize: 10,
  });

  return (
    <Card header={<CardTitle title="Permissions" subtitle={subtitle} />} className="p-0">
      <Table
        table={table}
        loading={Boolean(isLoading)}
        error={error}
        emptyChildren="No permissions granted"
        className="border-none"
      />
    </Card>
  );
};

interface OnChainCellProps {
  address: Address;
  chainId: number;
  permission?: AutoRevokePermission;
}

const OnChainCell = ({ address, chainId, permission }: OnChainCellProps) => {
  const { data, isFetching, error, refetch } = useOnChainPermissionCheck(address, chainId);

  if (!permission) {
    return (
      <div className="py-2">
        <span className="text-zinc-500">-</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-2">
      <Button style="secondary" size="sm" onClick={() => refetch()} loading={isFetching}>
        Check on-chain
      </Button>
      {data && !isFetching && (
        <OnChainResultLabel enabledOnChain={data.enabledOnChain} accountUpgraded={data.accountUpgraded} />
      )}
      {error && !isFetching && <span className="text-xs text-red-600 dark:text-red-400">Check failed</span>}
    </div>
  );
};

const OnChainResultLabel = ({ enabledOnChain, accountUpgraded }: OnChainPermissionCheck) => {
  if (enabledOnChain === null) {
    return (
      <StatusLabel status="neutral" className="py-0.75">
        no active permission
      </StatusLabel>
    );
  }

  return (
    <>
      <StatusLabel status={enabledOnChain ? 'success' : 'danger'} className="py-0.75">
        {enabledOnChain ? 'enabled' : 'disabled'}
      </StatusLabel>
      {accountUpgraded === false && <NotUpgradedLabel />}
    </>
  );
};

const NotUpgradedLabel = () => (
  <WithHoverTooltip tooltip="Wallet has no MetaMask delegator code on this chain. Actions wait as blocked_permission/account_not_upgraded until it upgrades.">
    <StatusLabel status="warning" className="py-0.75">
      not upgraded
    </StatusLabel>
  </WithHoverTooltip>
);

export default PermissionsCard;
