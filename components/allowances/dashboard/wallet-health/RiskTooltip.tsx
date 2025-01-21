import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { RiskFactor } from 'lib/interfaces';
import { filterUnknownRiskFactors, getRiskLevel } from 'lib/utils/risk';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import RiskFactorDisplay from './RiskFactorDisplay';

interface Props {
  riskFactors?: RiskFactor[];
}

const RiskTooltip = ({ riskFactors }: Props) => {
  const t = useTranslations();

  const filteredRiskFactors = filterUnknownRiskFactors(riskFactors ?? []);
  const riskLevel = getRiskLevel(filteredRiskFactors);

  // TODO: Properly handle low risk
  if (riskLevel === 'unknown' || riskLevel === 'low') return null;

  const riskFactorDisplays = filteredRiskFactors.map((riskFactor) => (
    <RiskFactorDisplay key={`${riskFactor.type}-${riskFactor.source}-${riskFactor.data}`} riskFactor={riskFactor} />
  ));

  const riskTooltip = (
    <div className="flex flex-col">
      {t('address.tooltips.risk_factors', { riskLevel: t(`address.risk_factors.levels.${riskLevel}`) })}
      <ul className="my-2">
        {riskFactorDisplays?.map((riskFactorDisplay) => (
          <li key={riskFactorDisplay.key}>{riskFactorDisplay}</li>
        ))}
      </ul>
    </div>
  );

  const className = twMerge(
    'w-6 h-6 focus:outline-black shrink-0',
    riskLevel === 'high' && 'text-red-500',
    riskLevel === 'medium' && 'text-yellow-500',
    // riskLevel === 'low' && 'text-green-500',
  );

  return (
    <WithHoverTooltip tooltip={riskTooltip}>
      <ExclamationTriangleIcon className={className} />
    </WithHoverTooltip>
  );
};

export default RiskTooltip;
