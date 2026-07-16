import { AUDIT_ACTIONS } from '@revoke.cash/core/audit/actions';
import AuditTable, { type AuditTableInitialFilters } from 'components/admin/audit/AuditTable';
import { parseAddressParam, parseAllowedListParam, type SearchParamValue } from 'lib/admin/search-params';

interface Props {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

const parseInitialFilters = (searchParams: Record<string, SearchParamValue>): AuditTableInitialFilters => {
  const { actions, address } = searchParams;

  return {
    actions: parseAllowedListParam(actions, AUDIT_ACTIONS),
    address: parseAddressParam(address),
  };
};

const AdminAuditPage = async ({ searchParams }: Props) => {
  const initialFilters = parseInitialFilters(await searchParams);

  return (
    <AuditTable
      title="Audit"
      subtitle="All recorded user and admin actions, with the raw details of each event"
      initialFilters={initialFilters}
    />
  );
};

export default AdminAuditPage;
