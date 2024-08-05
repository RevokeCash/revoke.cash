import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import CopyButton from 'components/common/CopyButton';
import Href from 'components/common/Href';
import Loader from 'components/common/Loader';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import { useOpenSeaProxyAddress } from 'lib/hooks/ethereum/useOpenSeaProxyAddress';
import type { AllowanceData } from 'lib/interfaces';
import { getChainExplorerUrl } from 'lib/utils/chains';
import { shortenAddress } from 'lib/utils/formatting';
import { filterUnknownRiskFactors } from 'lib/utils/risk';
import { getSpenderData } from 'lib/utils/whois';
import { useTranslations } from 'next-intl';
import RiskFactorDisplay from '../wallet-health/RiskFactorDisplay';

interface Props {
  allowance: AllowanceData;
}

const SpenderCell = ({ allowance }: Props) => {
  const t = useTranslations();
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

  const riskFactors = filterUnknownRiskFactors(spenderData?.riskFactors ?? []).map((riskFactor) => (
    <RiskFactorDisplay key={`${riskFactor.type}-${riskFactor.source}-${riskFactor.data}`} riskFactor={riskFactor} />
  ));

  const riskTooltip = (
    <div>
      {t('address.tooltips.risk_factors', { riskLevel: t('address.risk_factors.levels.high') })}
      <ul className="list-disc list-inside">
        {riskFactors?.map((riskFactor) => <li key={riskFactor.key}>{riskFactor}</li>)}
      </ul>
    </div>
  );

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
        {riskFactors?.length > 0 ? (
          <WithHoverTooltip tooltip={riskTooltip}>
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 focus:outline-black shrink-0" />
          </WithHoverTooltip>
        ) : null}
      </div>
    </Loader>
  );
};

export default SpenderCell;
