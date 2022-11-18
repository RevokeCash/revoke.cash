import useTranslation from 'next-translate/useTranslation';
import { useAsyncCallback } from 'react-async-hook';

interface Props {
  revoke: () => Promise<void>;
  disabled: boolean;
}

const RevokeButton = ({ disabled, revoke }: Props) => {
  const { t } = useTranslation();
  const { execute, loading } = useAsyncCallback(revoke);

  return (
    <>
      <button type="button" disabled={loading || disabled} className="btn-dark" onClick={execute}>
        {loading ? t('common:buttons.revoking') : t('common:buttons.revoke')}
      </button>
    </>
  );
};

export default RevokeButton;
