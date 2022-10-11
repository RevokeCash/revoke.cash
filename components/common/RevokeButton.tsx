import useTranslation from 'next-translate/useTranslation';
import { Button } from 'react-bootstrap';

interface Props {
  revoke: () => Promise<void>;
  disabled: boolean;
}

const RevokeButton = ({ disabled, revoke }: Props) => {
  const { t } = useTranslation();

  return (
    <Button size="sm" disabled={disabled} className="RevokeButton" onClick={revoke}>
      {t('common:buttons.revoke')}
    </Button>
  );
};

export default RevokeButton;
