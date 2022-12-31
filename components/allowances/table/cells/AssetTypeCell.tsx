import Label from 'components/common/Label';
import { classNames } from 'lib/utils/styles';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  assetType: 'NFT' | 'Token';
}

const AssetTypeCell = ({ assetType }: Props) => {
  const { t } = useTranslation();

  const classes = classNames('w-12', assetType === 'NFT' ? 'bg-blue-500 text-gray-100' : 'bg-yellow-500 text-gray-900');

  return (
    <div className="flex justify-start">
      <Label className={classes}>{t(`address:labels.${assetType.toLowerCase()}`)}</Label>
    </div>
  );
};

export default AssetTypeCell;
