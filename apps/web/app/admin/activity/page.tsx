import type { ActionStatus } from '@revoke.cash/core/auto-revoke/actions';
import { autoRevokeActionStatusEnum } from '@revoke.cash/core/db/schema/auto-revoke';
import ActivityTable, { type ActivityTableInitialFilters } from 'components/admin/activity/ActivityTable';
import { getAddress, isAddress } from 'viem';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Supports both the single form (?status=queued, ?chainId=1) and comma lists (?status=queued,failed)
const parseListParam = (param: string | string[] | undefined): string[] => {
  if (typeof param !== 'string') return [];
  return param
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const parseInitialFilters = (searchParams: Record<string, string | string[] | undefined>) => {
  const { status, chainId, address } = searchParams;

  const parsedStatuses = parseListParam(status).filter((entry): entry is ActionStatus =>
    (autoRevokeActionStatusEnum.enumValues as readonly string[]).includes(entry),
  );

  const parsedChainIds = parseListParam(chainId)
    .map(Number)
    .filter((parsedChainId) => Number.isInteger(parsedChainId) && parsedChainId > 0);

  const parsedAddress =
    typeof address === 'string' && isAddress(address, { strict: false }) ? getAddress(address) : undefined;

  const initialFilters: ActivityTableInitialFilters = {
    statuses: parsedStatuses,
    chainIds: parsedChainIds,
    address: parsedAddress,
  };

  return initialFilters;
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
