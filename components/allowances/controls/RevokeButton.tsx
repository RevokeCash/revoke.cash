import { TransactionSubmitted } from 'lib/interfaces';
import { waitForSubmittedTransactionConfirmation } from 'lib/utils';
import { useTranslations } from 'next-intl';
import { useAsyncCallback } from 'react-async-hook';
import Button from '../../common/Button';

interface Props {
  revoke: () => Promise<TransactionSubmitted>;
  disabled: boolean;
}

const RevokeButton = ({ disabled, revoke }: Props) => {
  const t = useTranslations();
  const { execute, loading } = useAsyncCallback(() => waitForSubmittedTransactionConfirmation(revoke()));

  return (
    <Button disabled={disabled} loading={loading} style="secondary" size="sm" onClick={execute}>
      {loading ? t('common.buttons.revoking') : t('common.buttons.revoke')}
    </Button>
  );
};

export default RevokeButton;
