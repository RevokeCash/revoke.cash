import ChainLogo from 'components/common/ChainLogo';
import { getChainName } from 'lib/utils/chains';

interface Props {
  chainId: number;
}

const ChainCell = ({ chainId }: Props) => {
  return (
    <div className="flex items-center gap-1 py-3.25">
      <ChainLogo chainId={chainId} />
      {getChainName(chainId)}
    </div>
  );
};

export default ChainCell;
