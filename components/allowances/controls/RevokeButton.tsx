import type { AllowanceData, TransactionSubmitted } from 'lib/interfaces';
import { useTransactionStore } from 'lib/stores/transaction-store';
import { getAllowanceKey } from 'lib/utils/allowances';
import { useTranslations } from 'next-intl';
import Button from '../../common/Button';

interface Props {
  allowance: AllowanceData;
  revoke: () => Promise<TransactionSubmitted>;
  disabled: boolean;
}

const RevokeButton = ({ allowance, disabled, revoke }: Props) => {
  const t = useTranslations();
  const result = useTransactionStore((state) => state.results[getAllowanceKey(allowance)]);
  const loading = result?.status === 'pending';

  return (
    <Button disabled={disabled} loading={loading} style="secondary" size="sm" onClick={revoke}>
      {loading ? t('common.buttons.revoking') : t('common.buttons.revoke')}
    </Button>
  );
};

export default RevokeButton;
