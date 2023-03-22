import Label from 'components/common/Label';
import useTranslation from 'next-translate/useTranslation';
import { twMerge } from 'tailwind-merge';

interface Props {
  assetType: 'NFT' | 'Token';
}

const AssetTypeCell = ({ assetType }: Props) => {
  const { t } = useTranslation();

  const classes = twMerge('w-12', assetType === 'NFT' ? 'bg-blue-500 text-zinc-100' : 'bg-yellow-500 text-zinc-900');

  return (
    <div className="flex justify-start">
      <Label className={classes}>{t(`address:labels.${assetType.toLowerCase()}`)}</Label>
    </div>
  );
};

export default AssetTypeCell;
