import { classNames } from 'lib/utils/styles';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  i18nKey: string;
  align?: 'left' | 'right';
}

const HeaderCell = ({ i18nKey, align }: Props) => {
  const { t } = useTranslation();
  const classes = classNames('font-bold', align === 'right' ? 'text-right' : 'text-left');
  return <div className={classes}>{t(i18nKey)}</div>;
};

export default HeaderCell;
