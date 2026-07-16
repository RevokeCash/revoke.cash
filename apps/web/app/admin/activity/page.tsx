import { autoRevokeActionStatusEnum } from '@revoke.cash/core/db/schema/auto-revoke';
import ActivityTable, { type ActivityTableInitialFilters } from 'components/admin/activity/ActivityTable';
import {
  parseAddressParam,
  parseAllowedListParam,
  parseListParam,
  type SearchParamValue,
} from 'lib/admin/search-params';

interface Props {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

const parseInitialFilters = (searchParams: Record<string, SearchParamValue>): ActivityTableInitialFilters => {
  const { status, chainId, address } = searchParams;

  const parsedChainIds = parseListParam(chainId)
    .map(Number)
    .filter((parsedChainId) => Number.isInteger(parsedChainId) && parsedChainId > 0);

  return {
    statuses: parseAllowedListParam(status, autoRevokeActionStatusEnum.enumValues),
    chainIds: parsedChainIds,
    address: parseAddressParam(address),
  };
};

const AdminActivityPage = async ({ searchParams }: Props) => {
  const initialFilters = parseInitialFilters(await searchParams);

  return (
    <ActivityTable
      title="Activity"
      subtitle="All auto-revoke actions across every wallet, including statuses hidden from users"
      initialFilters={initialFilters}
    />
  );
};

export default AdminActivityPage;
