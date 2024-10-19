import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import Href from 'components/common/Href';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { shortenAddress } from 'lib/utils/formatting';

interface Props {
  chainId: number;
  transactionHash: string;
}

const TransactionHashCell = ({ chainId, transactionHash }: Props) => {
  if (!transactionHash) return <div className="w-40">-</div>;

  const explorerUrl = getChainExplorerUrl(chainId);

  return (
    <div className="flex justify-start items-center font-monosans gap-2 w-40">
      <Href
        underline="hover"
        href={`${explorerUrl}/tx/${transactionHash}`}
        external
        className="flex items-center gap-1 tx-link"
      >
        {shortenAddress(transactionHash, 6)}
        <ArrowUpRightIcon className="w-4 h-4 text-zinc-400" />
      </Href>
    </div>
  );
};

export default TransactionHashCell;
