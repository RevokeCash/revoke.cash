import type { AutoRevokeActivityItem } from '@revoke.cash/core/auto-revoke/activity';
import StatusLabel, { type Status } from 'components/common/StatusLabel';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useTranslations } from 'next-intl';

export type ActivityStatusKey = 'pending' | 'submitting' | 'revoked' | 'failed' | 'skipped';

// Several action statuses share one user-facing status: every blocked_* status reads as "pending"
export const ACTIVITY_STATUS_KEYS: Record<AutoRevokeActivityItem['status'], ActivityStatusKey> = {
  succeeded: 'revoked',
  failed: 'failed',
  skipped: 'skipped',
  submitted: 'submitting',
  queued: 'pending',
  blocked_budget: 'pending',
  blocked_permission: 'pending',
  blocked_rules: 'pending',
};

export const ACTIVITY_STATUS_STYLES: Record<ActivityStatusKey, Status> = {
  revoked: 'success',
  failed: 'danger',
  skipped: 'neutral',
  submitting: 'info',
  pending: 'warning',
};

interface Props {
  status: AutoRevokeActivityItem['status'];
  errorCode: AutoRevokeActivityItem['errorCode'];
  errorDetail?: AutoRevokeActivityItem['errorDetail'];
  nextRetryAt: AutoRevokeActivityItem['nextRetryAt'];
  triggerType?: AutoRevokeActivityItem['triggerType'];
}

const AutoRevokeActivityStatusBadge = ({ status, errorCode, errorDetail, nextRetryAt, triggerType }: Props) => {
  const t = useTranslations();
  const statusKey = ACTIVITY_STATUS_KEYS[status];
  const label = (
    <StatusLabel status={ACTIVITY_STATUS_STYLES[statusKey]} className="min-w-18 py-0.75">
      {t(`account.auto_revoke.activity.status.${statusKey}`)}
    </StatusLabel>
  );

  const reason = getTooltipReason(status, errorCode, nextRetryAt, triggerType);
  if (!reason) return label;

  const tooltip = (
    <>
      {t(`account.auto_revoke.activity.reasons.${reason}`)}
      {status === 'failed' && errorDetail && <div className="mt-1 font-mono text-xs">{errorDetail}</div>}
    </>
  );

  return <WithHoverTooltip tooltip={tooltip}>{label}</WithHoverTooltip>;
};

const getTooltipReason = (
  status: AutoRevokeActivityItem['status'],
  errorCode: AutoRevokeActivityItem['errorCode'],
  nextRetryAt: AutoRevokeActivityItem['nextRetryAt'],
  triggerType?: AutoRevokeActivityItem['triggerType'],
): string | null => {
  // Exploit-triggered revokes bypass the monthly budget; they only wait once the spending ceiling is reached
  if (errorCode === 'monthly_budget' && triggerType === 'exploit') return 'monthly_budget_urgent';
  if (errorCode) return errorCode;
  if (status !== 'queued') return null;
  if (nextRetryAt && new Date(nextRetryAt) > new Date()) return 'cooling';
  return 'queued';
};

export default AutoRevokeActivityStatusBadge;
