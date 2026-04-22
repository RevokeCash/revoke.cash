import type { Nullable } from '@revoke.cash/core/types';
import type { SpenderData, SpenderRiskData } from '@revoke.cash/core/whois';
import ky from 'ky';
import { type Address, getAddress } from 'viem';
import type { SpenderDataSource } from './SpenderDataSource';

export class BackendSpenderDataSource implements SpenderDataSource {
  async getSpenderData(address: Address, chainId: number): Promise<Nullable<SpenderData | SpenderRiskData>> {
    return ky.get(`/api/${chainId}/spender/${getAddress(address)}`).json<Nullable<SpenderData | SpenderRiskData>>();
  }
}
