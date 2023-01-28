import Label from 'components/common/Label';
import { useEthereum } from 'lib/hooks/useEthereum';
import { classNames } from 'lib/utils/styles';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  address: string;
}

const ConnectedLabel = ({ address }: Props) => {
  const { t } = useTranslation();
  const { account } = useEthereum();

  const classes = classNames(
    address === account ? 'bg-green-500 text-white' : 'bg-zinc-300 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-100'
  );

  return (
    <Label className={classes}>
      {address === account ? t('address:labels.connected') : t('address:labels.not_connected')}
    </Label>
  );
};

export default ConnectedLabel;
