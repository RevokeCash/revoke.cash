import type { AutoRevokeActivityItem } from '@revoke.cash/core/auto-revoke/activity';
import Label from 'components/common/Label';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  triggerType: AutoRevokeActivityItem['triggerType'];
}

const TRIGGER_STYLES: Record<AutoRevokeActivityItem['triggerType'], string> = {
  exploit: 'bg-red-400',
  risk_score: 'bg-yellow-300',
  stale: 'bg-zinc-300',
};

const AutoRevokeActivityTriggerBadge = ({ triggerType }: Props) => {
  const t = useTranslations();
  const className = twMerge('min-w-18 py-0.75 text-zinc-900', TRIGGER_STYLES[triggerType]);

  return <Label className={className}>{t(`account.auto_revoke.activity.triggers.${triggerType}`)}</Label>;
};

export default AutoRevokeActivityTriggerBadge;
