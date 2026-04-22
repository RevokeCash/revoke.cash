import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  i18nKey: string;
  align?: 'left' | 'right';
}

const HeaderCell = ({ i18nKey, align }: Props) => {
  const t = useTranslations();
  const classes = twMerge('font-bold', align === 'right' ? 'text-right' : 'text-left');
  return <div className={classes}>{t(i18nKey)}</div>;
};

export default HeaderCell;
