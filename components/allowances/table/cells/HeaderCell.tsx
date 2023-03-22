import useTranslation from 'next-translate/useTranslation';
import { twMerge } from 'tailwind-merge';

interface Props {
  i18nKey: string;
  align?: 'left' | 'right';
}

const HeaderCell = ({ i18nKey, align }: Props) => {
  const { t } = useTranslation();
  const classes = twMerge('font-bold', align === 'right' ? 'text-right' : 'text-left');
  return <div className={classes}>{t(i18nKey)}</div>;
};

export default HeaderCell;
