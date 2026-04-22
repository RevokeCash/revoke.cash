import { getAllowanceI18nValues } from '@revoke.cash/core/allowances';
import { type ApprovalTokenEvent, type Enriched, eventToAllowance, isRevokeEvent } from '@revoke.cash/core/events';
import { useTranslations } from 'next-intl';

interface Props {
  event: Enriched<ApprovalTokenEvent>;
}

const HistoryAmountCell = ({ event }: Props) => {
  const t = useTranslations();

  const allowance = eventToAllowance(event);
  const { i18nKey, amount, tokenId, symbol } = getAllowanceI18nValues({ payload: allowance, metadata: event.metadata });

  if (isRevokeEvent(event) && !tokenId) return null;

  return (
    <div className="flex flex-col justify-start items-start truncate">
      <div className="w-full truncate">{t(i18nKey, { amount, tokenId, symbol } as any)}</div>
    </div>
  );
};

export default HistoryAmountCell;
