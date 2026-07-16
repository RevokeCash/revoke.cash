import TransactionHashCell from 'components/allowances/dashboard/cells/TransactionHashCell';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { Hash } from 'viem';

interface Props {
  chainId: number;
  txHash: Hash | null;
  txHashes: Hash[];
}

const ActivityTxHashCell = ({ chainId, txHash, txHashes }: Props) => {
  const cell = <TransactionHashCell chainId={chainId} transactionHash={txHash} />;

  if (txHashes.length <= 1) return cell;

  const tooltip = (
    <div className="flex flex-col gap-1 text-left">
      <span>All broadcast transactions (including replacements):</span>
      {txHashes.map((hash) => (
        <span key={hash} className="font-mono text-xs">
          {hash}
        </span>
      ))}
    </div>
  );

  return (
    <WithHoverTooltip tooltip={tooltip}>
      <div className="flex items-center gap-1">
        {cell}
        <span className="text-xs text-zinc-500 dark:text-zinc-400">+{txHashes.length - 1}</span>
      </div>
    </WithHoverTooltip>
  );
};

export default ActivityTxHashCell;
