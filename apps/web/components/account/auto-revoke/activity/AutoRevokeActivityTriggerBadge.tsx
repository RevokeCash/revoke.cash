import type { AutoRevokeActivityItem } from '@revoke.cash/core/auto-revoke/activity';
import StatusLabel, { type Status } from 'components/common/StatusLabel';
import { useTranslations } from 'next-intl';

interface Props {
  triggerType: AutoRevokeActivityItem['triggerType'];
}

const TRIGGER_STATUSES: Record<AutoRevokeActivityItem['triggerType'], Status> = {
  exploit: 'danger',
  risk_score: 'warning',
  stale: 'neutral',
};

const AutoRevokeActivityTriggerBadge = ({ triggerType }: Props) => {
  const t = useTranslations();

  return (
    <StatusLabel status={TRIGGER_STATUSES[triggerType]} className="min-w-18 py-0.75">
      {t(`account.auto_revoke.activity.triggers.${triggerType}`)}
    </StatusLabel>
  );
};

export default AutoRevokeActivityTriggerBadge;
