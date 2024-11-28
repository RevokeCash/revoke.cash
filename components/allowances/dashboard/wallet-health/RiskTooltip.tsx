import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { Nullable, SpenderRiskData } from 'lib/interfaces';
import { filterUnknownRiskFactors, getRiskLevel } from 'lib/utils/risk';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import RiskFactorDisplay from './RiskFactorDisplay';

interface Props {
  riskData?: Nullable<SpenderRiskData>;
}

const RiskTooltip = ({ riskData }: Props) => {
  const t = useTranslations();

  const filteredRiskFactors = filterUnknownRiskFactors(riskData?.riskFactors ?? []);
  const riskLevel = getRiskLevel(filteredRiskFactors);

  if (riskLevel === 'unknown') return null;

  const riskFactors = filteredRiskFactors.map((riskFactor) => (
    <RiskFactorDisplay key={`${riskFactor.type}-${riskFactor.source}-${riskFactor.data}`} riskFactor={riskFactor} />
  ));

  const riskTooltip = (
    <div className="flex flex-col">
      {t('address.tooltips.risk_factors', { riskLevel: t(`address.risk_factors.levels.${riskLevel}`) })}
      <ul className="my-2">{riskFactors?.map((riskFactor) => <li key={riskFactor.key}>{riskFactor}</li>)}</ul>
    </div>
  );

  const className = twMerge(
    'w-6 h-6 focus:outline-black shrink-0',
    riskLevel === 'high' && 'text-red-500',
    riskLevel === 'medium' && 'text-yellow-500',
    riskLevel === 'low' && 'text-green-500',
  );

  return (
    <WithHoverTooltip tooltip={riskTooltip}>
      <ExclamationTriangleIcon className={className} />
    </WithHoverTooltip>
  );
};

export default RiskTooltip;
