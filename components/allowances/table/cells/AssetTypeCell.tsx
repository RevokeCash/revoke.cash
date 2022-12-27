import Label from 'components/common/Label';
import { classNames } from 'lib/utils/styles';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  assetType: 'NFT' | 'Token';
}

const AssetTypeCell = ({ assetType }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex justify-start">
      <Label className={classNames('w-12', assetType === 'NFT' ? 'bg-blue-500 text-white' : 'bg-yellow-500')}>
        {t(`address:labels.${assetType.toLowerCase()}`)}
      </Label>
    </div>
  );
};

export default AssetTypeCell;
