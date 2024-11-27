import ky from 'ky';
import { SpenderData, SpenderRiskData } from 'lib/interfaces';
import { Address, getAddress } from 'viem';
import { SpenderDataSource } from './SpenderDataSource';

export class BackendSpenderDataSource implements SpenderDataSource {
  async getSpenderData(address: Address, chainId: number): Promise<SpenderData | SpenderRiskData | null> {
    return ky.get(`/api/${chainId}/spender/${getAddress(address)}`).json<SpenderData | SpenderRiskData | null>();
  }
}
