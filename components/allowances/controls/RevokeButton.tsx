import useTranslation from 'next-translate/useTranslation';
import { useAsyncCallback } from 'react-async-hook';
import Button from '../../common/Button';

interface Props {
  revoke: () => Promise<void>;
  disabled: boolean;
}

const RevokeButton = ({ disabled, revoke }: Props) => {
  const { t } = useTranslation();
  const { execute, loading } = useAsyncCallback(revoke);

  return (
    <Button disabled={disabled} loading={loading} style="secondary" size="sm" onClick={execute}>
      {loading ? t('common:buttons.revoking') : t('common:buttons.revoke')}
    </Button>
  );
};

export default RevokeButton;
