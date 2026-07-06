import type { AutoRevokeActivityItem } from '@revoke.cash/core/auto-revoke/activity';
import Label from 'components/common/Label';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  status: AutoRevokeActivityItem['status'];
  errorCode: AutoRevokeActivityItem['errorCode'];
}

const STATUS_STYLES: Record<AutoRevokeActivityItem['status'], { key: string; className: string }> = {
  succeeded: { key: 'revoked', className: 'bg-green-400' },
  failed: { key: 'failed', className: 'bg-red-400' },
  skipped: { key: 'skipped', className: 'bg-zinc-300' },
  submitted: { key: 'submitting', className: 'bg-blue-300' },
  queued: { key: 'pending', className: 'bg-yellow-300' },
  blocked_budget: { key: 'pending', className: 'bg-yellow-300' },
  blocked_permission: { key: 'pending', className: 'bg-yellow-300' },
  blocked_rules: { key: 'pending', className: 'bg-yellow-300' },
};

const AutoRevokeActivityStatusBadge = ({ status, errorCode }: Props) => {
  const t = useTranslations();
  const style = STATUS_STYLES[status];
  const label = (
    <Label className={twMerge('min-w-18 py-0.75 text-zinc-900', style.className)}>
      {t(`account.auto_revoke.activity.status.${style.key}`)}
    </Label>
  );

  if (!errorCode) return label;

  return <WithHoverTooltip tooltip={t(`account.auto_revoke.activity.reasons.${errorCode}`)}>{label}</WithHoverTooltip>;
};

export default AutoRevokeActivityStatusBadge;
