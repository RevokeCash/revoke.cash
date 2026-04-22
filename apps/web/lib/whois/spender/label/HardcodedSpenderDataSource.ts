import type { SpenderData } from 'lib/interfaces';
import type { Address } from 'viem';
import type { SpenderDataSource } from '../SpenderDataSource';

export class HardcodedSpenderDataSource implements SpenderDataSource {
  constructor(private data: Record<Address, SpenderData>) {}

  async getSpenderData(address: Address, _chainId: number): Promise<SpenderData | null> {
    return this.data[address] ?? null;
  }
}
