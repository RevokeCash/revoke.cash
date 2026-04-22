import CopyButton from 'components/common/CopyButton';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { shortenAddress } from 'lib/utils/formatting';

interface Props {
  hash?: string;
}

const HashCell = ({ hash }: Props) => {
  if (!hash) return <div className="w-40">-</div>;

  return (
    <div className="flex justify-start items-center font-monosans gap-2 w-40">
      <div className="flex items-center gap-1 tx-link">
        <WithHoverTooltip tooltip={hash}>
          <div className="flex items-center gap-1 tx-link">{shortenAddress(hash, 6)}</div>
        </WithHoverTooltip>
        <CopyButton content={hash} className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
      </div>
    </div>
  );
};

export default HashCell;
