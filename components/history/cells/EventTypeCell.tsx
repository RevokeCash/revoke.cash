import type { ApprovalTokenEvent } from 'lib/utils/events';
import { useTranslations } from 'next-intl';

interface Props {
  approvalEvent: ApprovalTokenEvent;
}

const EventTypeCell = ({ approvalEvent }: Props) => {
  const t = useTranslations();

  const isRevoked = 'amount' in approvalEvent.payload && approvalEvent.payload.amount === 0n;
  const eventType = isRevoked ? t('address.history.revoked') : t('address.history.approved');
  const className = isRevoked ? 'text-red-500' : 'text-green-500';

  return <div className={className}>{eventType}</div>;
};

export default EventTypeCell;
