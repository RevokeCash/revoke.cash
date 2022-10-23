import useTranslation from 'next-translate/useTranslation';
import { useAsyncCallback } from 'react-async-hook';
import { Button } from 'react-bootstrap';

interface Props {
  revoke: () => Promise<void>;
  disabled: boolean;
}

const RevokeButton = ({ disabled, revoke }: Props) => {
  const { t } = useTranslation();
  const { execute, loading } = useAsyncCallback(revoke);

  return (
    <Button size="sm" disabled={loading || disabled} className="RevokeButton" onClick={execute}>
      {loading ? t('common:buttons.revoking') : t('common:buttons.revoke')}
    </Button>
  );
};

export default RevokeButton;
