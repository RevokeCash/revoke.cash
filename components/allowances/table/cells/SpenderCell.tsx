import { useQuery } from '@tanstack/react-query';
import CopyButton from 'components/common/CopyButton';
import Href from 'components/common/Href';
import Spinner from 'components/common/Spinner';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useOpenSeaProxyAddress } from 'lib/hooks/ethereum/useOpenSeaProxyAddress';
import type { AllowanceData } from 'lib/interfaces';
import { shortenAddress } from 'lib/utils';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { addressToAppName } from 'lib/utils/whois';

interface Props {
  allowance: AllowanceData;
}

const SpenderCell = ({ allowance }: Props) => {
  const { openSeaProxyAddress } = useOpenSeaProxyAddress(allowance.owner);

  // TODO: Expose this data to react-table
  const { data: spenderName, isLoading } = useQuery({
    queryKey: ['spenderName', allowance.spender, allowance.chainId, openSeaProxyAddress],
    queryFn: () => addressToAppName(allowance.spender, allowance.chainId, openSeaProxyAddress),
    // Chances of this data changing while the user is on the page are very slim
    staleTime: Infinity,
  });

  const explorerUrl = `${getChainExplorerUrl(allowance.chainId)}/address/${allowance.spender}`;

  if (isLoading) {
    return <Spinner className="w-4 h-4" />;
  }

  if (!allowance.spender) {
    return null;
  }

  return (
    <div className="flex justify-start gap-1">
      <WithHoverTooltip tooltip={allowance.spender}>
        <div className="flex justify-start gap-1">
          <Href href={explorerUrl} underline="hover" external>
            {spenderName ?? shortenAddress(allowance.spender, 6)}
          </Href>
          <CopyButton content={allowance.spender} className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        </div>
      </WithHoverTooltip>
    </div>
  );
};

export default SpenderCell;
