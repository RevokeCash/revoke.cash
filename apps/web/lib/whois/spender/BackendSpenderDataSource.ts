import ky from 'ky';
import type { Nullable, SpenderData, SpenderRiskData } from 'lib/interfaces';
import { type Address, getAddress } from 'viem';
import type { SpenderDataSource } from './SpenderDataSource';

export class BackendSpenderDataSource implements SpenderDataSource {
  async getSpenderData(address: Address, chainId: number): Promise<Nullable<SpenderData | SpenderRiskData>> {
    return ky.get(`/api/${chainId}/spender/${getAddress(address)}`).json<Nullable<SpenderData | SpenderRiskData>>();
  }
}
