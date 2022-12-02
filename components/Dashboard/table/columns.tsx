import { createColumnHelper, RowData } from '@tanstack/react-table';
import { AllowanceData } from 'lib/interfaces';
import AllowanceCell from './AllowanceCell';
import ControlsCell from './controls/ControlsCell';
import HeaderCell from './HeaderCell';
import SpenderCell from './SpenderCell';
import TokenCell from './TokenCell';

declare module '@tanstack/table-core' {
  interface TableMeta<TData extends RowData> {
    onUpdate: (allowance: AllowanceData, newAmount?: string) => void;
  }
}

const columnHelper = createColumnHelper<AllowanceData>();

const allowanceAccessor = (allowance: AllowanceData) => {
  if (!allowance.spender) return 'None';

  return allowance.amount ?? allowance.tokenId ?? 'Unlimited';
};

export const columns = [
  columnHelper.accessor('symbol', {
    id: 'Token',
    header: () => <HeaderCell i18nKey="dashboard:headers.token" />,
    cell: (info) => <TokenCell allowance={info.row.original} />,
  }),
  columnHelper.accessor(allowanceAccessor, {
    id: 'Allowance',
    header: () => <HeaderCell i18nKey="dashboard:headers.allowance" />,
    cell: (info) => <AllowanceCell allowance={info.row.original} />,
  }),
  columnHelper.accessor('spender', {
    id: 'Spender',
    header: () => <HeaderCell i18nKey="dashboard:headers.spender" />,
    cell: (info) => <SpenderCell allowance={info.row.original} />,
  }),
  columnHelper.display({
    id: 'Actions',
    cell: (info) => <ControlsCell allowance={info.row.original} onUpdate={info.table.options.meta.onUpdate} />,
  }),
];
