import { useQuery } from '@tanstack/react-query';
import CopyButton from 'components/common/CopyButton';
import Href from 'components/common/Href';
import Loader from 'components/common/Loader';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useOpenSeaProxyAddress } from 'lib/hooks/ethereum/useOpenSeaProxyAddress';
import type { AllowanceData } from 'lib/interfaces';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { shortenAddress } from 'lib/utils/formatting';
import { getSpenderData } from 'lib/utils/whois';
import RiskTooltip from '../wallet-health/RiskTooltip';

interface Props {
  allowance: AllowanceData;
}

const SpenderCell = ({ allowance }: Props) => {
  const { openSeaProxyAddress } = useOpenSeaProxyAddress(allowance.owner);

  // TODO: Expose this data to react-table
  const { data: spenderData, isLoading } = useQuery({
    queryKey: ['spenderData', allowance.spender, allowance.chainId, openSeaProxyAddress],
    queryFn: () => getSpenderData(allowance.spender, allowance.chainId, openSeaProxyAddress),
    // Chances of this data changing while the user is on the page are very slim
    staleTime: Infinity,
  });

  const explorerUrl = `${getChainExplorerUrl(allowance.chainId)}/address/${allowance.spender}`;

  if (!allowance.spender) {
    return null;
  }

  return (
    <Loader isLoading={isLoading}>
      <div className="flex items-center gap-2 w-52">
        <div className="flex flex-col justify-start items-start">
          <WithHoverTooltip tooltip={allowance.spender}>
            <Href href={explorerUrl} underline="hover" external>
              <div className="max-w-[10rem] truncate">{spenderData?.name ?? shortenAddress(allowance.spender, 6)}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {spenderData?.name ? shortenAddress(allowance.spender, 6) : null}
              </div>
            </Href>
          </WithHoverTooltip>
        </div>
        <CopyButton content={allowance.spender} className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        <RiskTooltip riskData={spenderData} />
      </div>
    </Loader>
  );
};

export default SpenderCell;
