import { useQuery } from '@tanstack/react-query';
import CopyButton from 'components/common/CopyButton';
import Href from 'components/common/Href';
import Loader from 'components/common/Loader';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { isNullish } from 'lib/utils';
import { AllowanceType, type TokenAllowanceData } from 'lib/utils/allowances';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { shortenAddress } from 'lib/utils/formatting';
import { YEAR } from 'lib/utils/time';
import { getSpenderData } from 'lib/utils/whois';
import { useMemo } from 'react';
import RiskTooltip from '../wallet-health/RiskTooltip';

interface Props {
  allowance: TokenAllowanceData;
}

const SpenderCell = ({ allowance }: Props) => {
  // TODO: Expose this data to react-table
  const { data: spenderData, isLoading } = useQuery({
    queryKey: ['spenderData', allowance.payload?.spender, allowance.chainId],
    queryFn: () => getSpenderData(allowance.payload!.spender, allowance.chainId),
    // Chances of this data changing while the user is on the page are very slim
    staleTime: Number.POSITIVE_INFINITY,
    enabled: !isNullish(allowance.payload?.spender),
  });

  // Add non-spender-specific risk factors (TODO: set up a proper system for this)
  const riskFactors = useMemo(() => {
    const factors = spenderData?.riskFactors ?? [];

    if (allowance.payload?.type === AllowanceType.PERMIT2 && allowance.payload.expiration > Date.now() + 1 * YEAR) {
      return [...factors, { type: 'excessive_expiration', source: 'onchain' }];
    }

    return factors;
  }, [allowance.payload, spenderData?.riskFactors]);

  const explorerUrl = `${getChainExplorerUrl(allowance.chainId)}/address/${allowance.payload?.spender}`;

  if (!allowance.payload) return null;

  return (
    <Loader isLoading={isLoading}>
      <div className="flex items-center gap-2 w-52">
        <div className="flex flex-col justify-start items-start">
          <WithHoverTooltip tooltip={allowance.payload.spender}>
            <Href href={explorerUrl} underline="hover" external>
              <div className="max-w-[10rem] truncate">
                {spenderData?.name ?? shortenAddress(allowance.payload.spender, 6)}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {spenderData?.name ? shortenAddress(allowance.payload.spender, 6) : null}
              </div>
            </Href>
          </WithHoverTooltip>
        </div>
        <CopyButton content={allowance.payload.spender} className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        <RiskTooltip riskFactors={riskFactors} />
      </div>
    </Loader>
  );
};

export default SpenderCell;
