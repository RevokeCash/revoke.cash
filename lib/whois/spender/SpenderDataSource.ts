import type { Nullable, SpenderData, SpenderRiskData } from 'lib/interfaces';
import type { Address } from 'viem';

export interface SpenderDataSource {
  getSpenderData(spender: Address, chainId: number): Promise<Nullable<SpenderData | SpenderRiskData>>;
}
