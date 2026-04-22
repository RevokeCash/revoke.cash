import { createColumnHelper, type Row, type RowData, sortingFns } from '@tanstack/react-table';
import HeaderCell from 'components/allowances/dashboard/cells/HeaderCell';
import LastUpdatedCell from 'components/allowances/dashboard/cells/LastUpdatedCell';
import type { Session } from 'lib/utils/sessions';
import ControlsCell from './cells/ControlsCell';
import ExpirationCell from './cells/ExpirationCell';
import HashCell from './cells/HashCell';
import PolicyTypeCell from './cells/PolicyTypeCell';
import SignerCell from './cells/SignerCell';

declare module '@tanstack/table-core' {
  interface TableMeta<TData extends RowData> {
    onSessionRevoke: (session: Session) => void;
  }
}

export enum ColumnId {
  SELECT = 'Select',
  POLICY_TYPE = 'Permission Type',
  // TODO: We should be able to calculate these from inspecting the call and transfer policies
  // SYMBOL = 'Asset Name',
  // ASSET_TYPE = 'Asset Type',
  // BALANCE = 'Balance',
  // VALUE_AT_RISK = 'Value at Risk',
  SIGNER = 'Approved Signer',
  SESSION_HASH = 'Session Hash',
  EXPIRATION = 'Expiration',
  LAST_UPDATED = 'Last Updated',
  ACTIONS = 'Actions',
}

export const accessors = {
  policyType: (session: Session) => {
    const callPolicies = session.payload.sessionSpec.callPolicies.length;
    const transferPolicies = session.payload.sessionSpec.transferPolicies.length;

    if (callPolicies > 0 && transferPolicies > 0) return 'All';
    if (callPolicies > 0) return 'Calls';
    if (transferPolicies > 0) return 'Transfers';

    return 'None';
  },
  expiration: (session: Session) => {
    return session?.payload?.sessionSpec?.expiresAt;
  },
  timestamp: (session: Session) => {
    return session?.lastUpdated?.timestamp;
  },
  signer: (session: Session) => {
    return session?.payload?.sessionSpec?.signer;
  },
  sessionHash: (session: Session) => {
    return session?.payload?.sessionHash;
  },
};

export const customSortingFns = {
  timestamp: (rowA: Row<Session>, rowB: Row<Session>, columnId: string) => {
    return sortingFns.basic(rowA, rowB, columnId);
  },
};

const columnHelper = createColumnHelper<Session>();
export const columns = [
  // columnHelper.display({
  //   id: ColumnId.SELECT,
  //   footer: ({ table }) => <GlobalSelectCell table={table} />,
  //   cell: ({ row }) => <SelectCell row={row} />,
  // }),
  columnHelper.accessor(accessors.sessionHash, {
    id: ColumnId.SESSION_HASH,
    header: () => <HeaderCell i18nKey="address.headers.session_hash" />,
    cell: (info) => <HashCell hash={info.row.original.payload.sessionHash} />,
  }),
  columnHelper.accessor(accessors.policyType, {
    id: ColumnId.POLICY_TYPE,
    header: () => <HeaderCell i18nKey="address.headers.policy_type" />,
    cell: (info) => <PolicyTypeCell policyType={info.getValue()} session={info.row.original} />,
  }),
  columnHelper.accessor(accessors.signer, {
    id: ColumnId.SIGNER,
    header: () => <HeaderCell i18nKey="address.headers.signer" />,
    cell: (info) => <SignerCell session={info.row.original} />,
  }),
  columnHelper.accessor(accessors.expiration, {
    id: ColumnId.EXPIRATION,
    header: () => <HeaderCell i18nKey="address.headers.expiration" />,
    cell: (info) => <ExpirationCell expiration={info.row.original.payload.sessionSpec.expiresAt} />,
  }),
  columnHelper.accessor(accessors.timestamp, {
    id: ColumnId.LAST_UPDATED,
    header: () => <HeaderCell i18nKey="address.headers.last_updated" />,
    cell: (info) => (
      <LastUpdatedCell chainId={info.row.original.chainId} lastUpdated={info.row.original?.lastUpdated} />
    ),
  }),
  columnHelper.display({
    id: ColumnId.ACTIONS,
    header: () => <HeaderCell i18nKey="address.headers.actions" align="right" />,
    cell: (info) => <ControlsCell session={info.row.original} onRevoke={info.table.options.meta!.onSessionRevoke} />,
  }),
];
