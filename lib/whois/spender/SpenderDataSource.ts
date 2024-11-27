import type { SpenderData, SpenderRiskData } from 'lib/interfaces';
import type { Address } from 'viem';

export interface SpenderDataSource {
  getSpenderData(spender: Address, chainId: number): Promise<SpenderData | SpenderRiskData | null>;
}
