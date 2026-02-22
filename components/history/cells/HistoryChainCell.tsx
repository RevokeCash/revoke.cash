import ChainLogo from 'components/common/ChainLogo';
import { getChainName } from 'lib/utils/chains';

interface Props {
  chainId: number;
}

const HistoryChainCell = ({ chainId }: Props) => {
  return (
    <div className="flex items-center gap-1.5 py-3.25 w-32">
      <ChainLogo chainId={chainId} size={24} />
      <span>{getChainName(chainId)}</span>
    </div>
  );
};

export default HistoryChainCell;
