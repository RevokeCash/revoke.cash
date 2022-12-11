import useTranslation from 'next-translate/useTranslation';

interface Props {
  i18nKey: string;
}

const HeaderCell = ({ i18nKey }: Props) => {
  const { t } = useTranslation();
  return <div className="font-bold text-left">{t(i18nKey)}</div>;
};

export default HeaderCell;
