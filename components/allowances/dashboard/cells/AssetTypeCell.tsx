import Label from 'components/common/Label';
import useTranslation from 'next-translate/useTranslation';
import { twMerge } from 'tailwind-merge';

interface Props {
  assetType: 'NFT' | 'Token';
}

const AssetTypeCell = ({ assetType }: Props) => {
  const { t, lang } = useTranslation();

  const classes = twMerge(
    lang === 'ja' ? 'w-16' : 'w-12',
    assetType === 'NFT' ? 'bg-blue-400 text-zinc-900' : 'bg-yellow-400 text-zinc-900'
  );

  return (
    <div className="flex justify-start">
      <Label className={classes}>{t(`address:labels.${assetType.toLowerCase()}`)}</Label>
    </div>
  );
};

export default AssetTypeCell;
