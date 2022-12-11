import Label from 'components/common/Label';
import { classNames } from 'lib/utils/styles';

interface Props {
  assetType: 'NFT' | 'Token';
}

const AssetTypeCell = ({ assetType }: Props) => {
  return (
    <Label className={classNames('w-full', assetType === 'NFT' ? 'bg-blue-500 text-white' : 'bg-yellow-500')}>
      {assetType}
    </Label>
  );
};

export default AssetTypeCell;
