export interface RiskFactor {
  type: string;
  source: string;
  data?: string;
}

export type RiskLevel = 'high' | 'medium' | 'low' | 'unknown';

export const RiskFactorScore: Record<string, number> = {
  allowlist: -100,
  blocklist: 100,
  closed_source: 40,
  deprecated: 100,
  eoa: 100,
  excessive_expiration: 60,
  exploit: 100,
  proxy: 20,
  suspicious_address: 60,
  unsafe: 40,
  uninitialized: 40,
};

export const filterUnknownRiskFactors = (riskFactors: RiskFactor[]): RiskFactor[] => {
  return riskFactors.filter((riskFactor) => RiskFactorScore[riskFactor.type] !== undefined);
};

export const getRiskFactorScore = (riskFactor: RiskFactor): number => {
  return RiskFactorScore[riskFactor.type] ?? 0;
};

export const calculateRiskScore = (riskFactors: RiskFactor[]): number => {
  const riskScore = riskFactors.reduce((acc, riskFactor) => acc + getRiskFactorScore(riskFactor), 0);
  return Math.max(Math.min(riskScore, 100), 0);
};

export const getRiskLevel = (riskFactors: RiskFactor[]): RiskLevel => {
  if (riskFactors.length === 0) return 'unknown';

  const riskScore = calculateRiskScore(riskFactors);

  if (riskScore >= 75) return 'high';
  if (riskScore <= 25) return 'low';

  return 'medium';
};
