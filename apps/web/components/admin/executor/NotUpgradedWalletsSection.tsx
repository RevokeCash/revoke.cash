'use client';

import type { NotUpgradedWallet } from '@revoke.cash/core/admin/executor';
import { createColumnHelper } from '@tanstack/react-table';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import TimeAgoCell from 'components/admin/common/TimeAgoCell';
import Card, { CardTitle } from 'components/common/Card';
import ChainDisplay from 'components/common/ChainDisplay';
import Href from 'components/common/Href';
import Table from 'components/common/table/Table';
import { formatUsd } from 'lib/admin/format';
import { useAdminExecutorProblems } from 'lib/hooks/admin/useAdminExecutor';
import { useTable } from 'lib/hooks/useTable';
import type { AppTableFeatures } from 'lib/utils/table';

const columnHelper = createColumnHelper<AppTableFeatures, NotUpgradedWallet>();

const columns = columnHelper.columns([
  columnHelper.accessor('chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => (
      <div className="py-1.5 pr-4">
        <ChainDisplay chainId={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('address', {
    id: 'address',
    header: 'Address',
    cell: (info) => (
      <div className="py-1.5 pr-4">
        <AdminAddressLink address={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('subscriptionId', {
    id: 'subscription',
    header: 'Subscription',
    cell: (info) => (
      <div className="py-1.5 pr-4">
        <Href href={`/admin/subscriptions/${info.getValue()}`} router underline="always">
          View subscription
        </Href>
      </div>
    ),
  }),
  columnHelper.accessor('permissionCreatedAt', {
    id: 'permissionGranted',
    header: 'Permission granted',
    cell: (info) => (
      <div className="py-1.5 pr-4">
        <TimeAgoCell timestamp={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('blockedActionCount', {
    id: 'waitingActions',
    header: 'Waiting actions',
    cell: (info) => <div className="py-1.5 pr-4">{info.getValue()}</div>,
  }),
  columnHelper.accessor('valueAtRiskUsd', {
    id: 'valueAtRisk',
    header: 'Value at risk',
    cell: (info) => {
      const valueAtRiskUsd = info.getValue();
      return <div className="py-1.5 pr-4">{valueAtRiskUsd === null ? '-' : formatUsd(valueAtRiskUsd)}</div>;
    },
  }),
]);

const NotUpgradedWalletsSection = () => {
  const { data, isLoading, error } = useAdminExecutorProblems();

  const table = useTable({
    data: data?.notUpgradedWallets ?? [],
    columns,
    getRowId: (row) => `${row.address}-${row.chainId}`,
    pageSize: 10,
  });

  return (
    <div id="wallets-not-upgraded">
      <Card
        header={
          <CardTitle
            title="Wallets not upgraded"
            subtitle="Ultimate wallets whose permission cannot execute until the wallet upgrades to the MetaMask smart account. Contact the user."
          />
        }
        className="p-0"
      >
        <Table
          table={table}
          loading={isLoading}
          error={error}
          emptyChildren="All permissioned wallets are upgraded"
          className="border-none"
        />
      </Card>
    </div>
  );
};

export default NotUpgradedWalletsSection;
