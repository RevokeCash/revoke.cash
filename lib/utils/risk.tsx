import { ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { RiskFactor, RiskLevel } from 'lib/interfaces';
import { track } from './analytics';

export const RiskFactorScore: Record<string, number> = {
  blocklist: 100,
  closed_source: 50,
  deprecated: 100,
  eoa: 100,
  exploit: 100,
  phishing_risk: 50,
  unsafe: 50,
};

export const filterUnknownRiskFactors = (riskFactors: RiskFactor[]): RiskFactor[] => {
  return riskFactors.filter((riskFactor) => {
    if (RiskFactorScore[riskFactor.type] === undefined) {
      track('Unknown Risk Factor', riskFactor);
      return false;
    }

    return true;
  });
};

export const calculateRiskScore = (riskFactors: RiskFactor[]): number => {
  const riskScore = riskFactors.reduce((acc, riskFactor) => acc + (RiskFactorScore[riskFactor.type] ?? 0), 0);
  return Math.max(Math.min(riskScore, 100), 0);
};

export const getRiskLevel = (riskFactors: RiskFactor[]): RiskLevel => {
  if (riskFactors.length === 0) return 'unknown';

  const riskScore = calculateRiskScore(riskFactors);

  if (riskScore >= 80) return 'high';
  if (riskScore <= 20) return 'low';

  return 'medium';
};

export const getRiskIcon = (riskFactor: RiskFactor) => {
  const score = RiskFactorScore[riskFactor.type];

  if (score > 75) {
    return <ExclamationCircleIcon className=" text-red-500 h-5" />;
  }

  if (score > 25) {
    return <ExclamationTriangleIcon className="text-yellow-500 h-5" />;
  }

  return <InformationCircleIcon className="text-green-500 h-5" />;
};
