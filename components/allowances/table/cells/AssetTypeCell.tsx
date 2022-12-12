import Label from 'components/common/Label';
import { classNames } from 'lib/utils/styles';

interface Props {
  assetType: 'NFT' | 'Token';
}

const AssetTypeCell = ({ assetType }: Props) => {
  return (
    <div className="flex justify-end">
      <Label className={classNames('w-12', assetType === 'NFT' ? 'bg-blue-500 text-white' : 'bg-yellow-500')}>
        {assetType}
      </Label>
    </div>
  );
};

export default AssetTypeCell;
