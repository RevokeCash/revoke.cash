'use client';

import type { EvaluationBacklogRow } from '@revoke.cash/core/admin/health';
import { createColumnHelper } from '@tanstack/react-table';
import AdminAddressLink from 'components/admin/common/AdminAddressLink';
import TimeAgoCell from 'components/admin/common/TimeAgoCell';
import ChainDisplay from 'components/common/ChainDisplay';
import { useAdminEvaluationBacklog } from 'lib/hooks/admin/useAdminHealthDetails';
import HealthDetailPanel from './HealthDetailPanel';

interface Props {
  isOpen: boolean;
}

const columnHelper = createColumnHelper<EvaluationBacklogRow>();

const columns = [
  columnHelper.accessor('address', {
    id: 'address',
    header: 'Address',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <AdminAddressLink address={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('chainId', {
    id: 'chain',
    header: 'Chain',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <ChainDisplay chainId={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('computedAt', {
    id: 'computed',
    header: 'Computed',
    cell: (info) => (
      <div className="py-1.5 pr-4 text-sm">
        <TimeAgoCell timestamp={info.getValue()} />
      </div>
    ),
  }),
  columnHelper.accessor('lastEvaluatedAt', {
    id: 'lastEvaluated',
    header: 'Last evaluated',
    cell: (info) => (
      <div className="py-1.5 text-sm">
        <TimeAgoCell timestamp={info.getValue()} fallback="never" />
      </div>
    ),
  }),
];

const EvaluationBacklogPanel = ({ isOpen }: Props) => {
  const query = useAdminEvaluationBacklog(isOpen);

  return (
    <HealthDetailPanel
      isOpen={isOpen}
      query={query}
      columns={columns}
      getRowId={(row) => `${row.address}-${row.chainId}`}
      emptyChildren="No evaluation backlog"
    />
  );
};

export default EvaluationBacklogPanel;
