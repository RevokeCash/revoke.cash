import ky from 'ky';
import type { SpenderData, SpenderRiskData } from 'lib/interfaces';
import { type Address, getAddress } from 'viem';
import type { SpenderDataSource } from './SpenderDataSource';

export class BackendSpenderDataSource implements SpenderDataSource {
  async getSpenderData(address: Address, chainId: number): Promise<SpenderData | SpenderRiskData | null> {
    return ky.get(`/api/${chainId}/spender/${getAddress(address)}`).json<SpenderData | SpenderRiskData | null>();
  }
}
