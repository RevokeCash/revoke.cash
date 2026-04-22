import { WHOIS_BASE_URL } from '@revoke.cash/core/constants';
import ky from '@revoke.cash/core/ky';
import { normaliseRiskData } from '@revoke.cash/core/risk';
import type { SpenderData } from '@revoke.cash/core/whois';
import { type Address, getAddress } from 'viem';
import type { SpenderDataSource } from '../SpenderDataSource';

export class WhoisSpenderDataSource implements SpenderDataSource {
  async getSpenderData(address: Address, chainId: number): Promise<SpenderData | null> {
    try {
      const labelData = await ky.get(`${WHOIS_BASE_URL}/spenders/${chainId}/${getAddress(address)}.json`).json<any>();

      if (!labelData || Object.keys(labelData).length === 0) return null;

      return normaliseRiskData(labelData, 'whois');
    } catch {
      return null;
    }
  }
}
