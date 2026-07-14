import type { AdminActivityItem } from '@revoke.cash/core/admin/activity';
import type { ActionStatus } from '@revoke.cash/core/auto-revoke/actions';
import AutoRevokeActivityStatusBadge from 'components/account/auto-revoke/activity/AutoRevokeActivityStatusBadge';
import StatusLabel from 'components/common/StatusLabel';

// The user-facing badge only makes sense for the statuses the user-facing feed shows; the statuses
// hidden from users (blocked_permission, blocked_rules, skipped) get a plain neutral label instead.
const USER_FACING_STATUSES: readonly ActionStatus[] = ['queued', 'blocked_budget', 'submitted', 'succeeded', 'failed'];

interface Props {
  status: AdminActivityItem['status'];
  errorCode: AdminActivityItem['errorCode'];
  nextRetryAt: AdminActivityItem['nextRetryAt'];
}

const ActivityStatusCell = ({ status, errorCode, nextRetryAt }: Props) => {
  if (USER_FACING_STATUSES.includes(status)) {
    return <AutoRevokeActivityStatusBadge status={status} errorCode={errorCode} nextRetryAt={nextRetryAt} />;
  }

  return (
    <StatusLabel status="neutral" className="min-w-18 py-0.75">
      {status}
    </StatusLabel>
  );
};

export default ActivityStatusCell;
