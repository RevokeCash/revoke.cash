import { SpenderData, SpenderRiskData } from 'lib/interfaces';
import { Address } from 'viem';

export interface SpenderDataSource {
  getSpenderData(spender: Address, chainId: number): Promise<SpenderData | SpenderRiskData | null>;
}
