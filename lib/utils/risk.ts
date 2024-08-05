import { RiskFactor } from 'lib/interfaces';
import { track } from './analytics';

export const RiskFactorScore = {
  blocklist: 100,
  is_eoa: 100,
  deprecated: 100,
  exploit: 100,
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
  return Math.max(
    Math.min(
      riskFactors.reduce((acc, riskFactor) => acc + RiskFactorScore[riskFactor.type], 0),
      100,
    ),
    0,
  );
};
