import Button from 'components/common/Button';
import { useSiwe } from 'lib/hooks/ethereum/useSiwe';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'none';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
  redirectOnConnect?: boolean;
}

const SiweButton = ({ text, size, style, className }: Props) => {
  const { t } = useTranslation();
  const { signIn, error } = useSiwe();

  return (
    <Button style={style ?? 'primary'} size={size ?? 'md'} onClick={() => signIn()} className={className}>
      {text ?? t('common:buttons.siwe')} {error}
    </Button>
  );
};

export default SiweButton;
