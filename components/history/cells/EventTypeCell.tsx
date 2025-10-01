import Label from 'components/common/Label';
import { isRevokeEvent } from 'lib/utils/events';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import type { ApprovalHistoryEvent } from '../utils';

interface Props {
  approvalEvent: ApprovalHistoryEvent;
}

const EventTypeCell = ({ approvalEvent }: Props) => {
  const t = useTranslations();

  const isRevoked = isRevokeEvent(approvalEvent);

  const eventType = isRevoked ? t('address.history.revoked') : t('address.history.approved');
  const className = twMerge('w-18 py-0.75', isRevoked ? 'bg-red-400 text-zinc-900' : 'bg-green-400 text-zinc-900');
  return <Label className={className}>{eventType}</Label>;
};

export default EventTypeCell;
