import type { AutoRevokeActivityItem } from '@revoke.cash/core/auto-revoke/activity';
import StatusLabel, { type Status } from 'components/common/StatusLabel';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useTranslations } from 'next-intl';

interface Props {
  status: AutoRevokeActivityItem['status'];
  errorCode: AutoRevokeActivityItem['errorCode'];
  nextRetryAt: AutoRevokeActivityItem['nextRetryAt'];
}

const STATUS_STYLES: Record<AutoRevokeActivityItem['status'], { key: string; status: Status }> = {
  succeeded: { key: 'revoked', status: 'success' },
  failed: { key: 'failed', status: 'danger' },
  skipped: { key: 'skipped', status: 'neutral' },
  submitted: { key: 'submitting', status: 'info' },
  queued: { key: 'pending', status: 'warning' },
  blocked_budget: { key: 'pending', status: 'warning' },
  blocked_permission: { key: 'pending', status: 'warning' },
  blocked_rules: { key: 'pending', status: 'warning' },
};

const AutoRevokeActivityStatusBadge = ({ status, errorCode, nextRetryAt }: Props) => {
  const t = useTranslations();
  const style = STATUS_STYLES[status];
  const label = (
    <StatusLabel status={style.status} className="min-w-18 py-0.75">
      {t(`account.auto_revoke.activity.status.${style.key}`)}
    </StatusLabel>
  );

  const reason = getTooltipReason(status, errorCode, nextRetryAt);
  if (!reason) return label;

  return <WithHoverTooltip tooltip={t(`account.auto_revoke.activity.reasons.${reason}`)}>{label}</WithHoverTooltip>;
};

const getTooltipReason = (
  status: AutoRevokeActivityItem['status'],
  errorCode: AutoRevokeActivityItem['errorCode'],
  nextRetryAt: AutoRevokeActivityItem['nextRetryAt'],
): string | null => {
  if (errorCode) return errorCode;
  if (status !== 'queued') return null;
  if (nextRetryAt && new Date(nextRetryAt) > new Date()) return 'cooling';
  return 'queued';
};

export default AutoRevokeActivityStatusBadge;
