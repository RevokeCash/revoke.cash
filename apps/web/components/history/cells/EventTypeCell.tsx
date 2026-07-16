import { type ApprovalTokenEvent, type Enriched, isCancelPermitEvent, isRevokeEvent } from '@revoke.cash/core/events';
import StatusLabel from 'components/common/StatusLabel';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  approvalEvent: Enriched<ApprovalTokenEvent>;
}

const EventTypeCell = ({ approvalEvent }: Props) => {
  const t = useTranslations();

  const isRevoked = isRevokeEvent(approvalEvent);
  const isCancelPermit = isCancelPermitEvent(approvalEvent);

  const eventType = isCancelPermit
    ? t('address.history.cancelled_signatures')
    : isRevoked
      ? t('address.history.revoked')
      : t('address.history.approved');

  const status = isCancelPermit ? 'warning' : isRevoked ? 'danger' : 'success';
  const className = twMerge('w-18 py-0.75', isCancelPermit && 'w-35');

  return (
    <StatusLabel status={status} className={className}>
      {eventType}
    </StatusLabel>
  );
};

export default EventTypeCell;
