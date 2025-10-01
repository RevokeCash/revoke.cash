import { getAllowanceI18nValues } from 'lib/utils/allowances';
import { eventToAllowance, isRevokeEvent } from 'lib/utils/events';
import { useTranslations } from 'next-intl';
import type { ApprovalHistoryEvent } from '../utils';

interface Props {
  event: ApprovalHistoryEvent;
}

const HistoryAmountCell = ({ event }: Props) => {
  const t = useTranslations();

  const allowance = eventToAllowance(event);
  const { i18nKey, amount, tokenId, symbol } = getAllowanceI18nValues({ payload: allowance, metadata: event.metadata });

  if (isRevokeEvent(event) && !tokenId) return null;

  return (
    <div className="flex flex-col justify-start items-start truncate">
      <div className="w-full truncate">{t(i18nKey, { amount, tokenId, symbol })}</div>
    </div>
  );
};

export default HistoryAmountCell;
