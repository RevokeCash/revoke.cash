import type { TransactionSubmitted } from 'lib/interfaces';
import { useTransactionStore } from 'lib/stores/transaction-store';
import { useTranslations } from 'next-intl';
import Button from '../../common/Button';

interface Props {
  transactionKey: string;
  revoke: () => Promise<TransactionSubmitted | undefined>;
  disabled: boolean;
}

const RevokeButton = ({ transactionKey, disabled, revoke }: Props) => {
  const t = useTranslations();
  const result = useTransactionStore((state) => state.results[transactionKey]);
  const loading = result?.status === 'pending';

  return (
    <Button disabled={disabled} loading={loading} style="secondary" size="sm" onClick={revoke}>
      {loading ? t('common.buttons.revoking') : t('common.buttons.revoke')}
    </Button>
  );
};

export default RevokeButton;
