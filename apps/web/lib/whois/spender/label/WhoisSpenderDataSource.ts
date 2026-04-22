import { WHOIS_BASE_URL } from 'lib/constants';
import type { SpenderData } from 'lib/interfaces';
import ky from 'lib/ky';
import { normaliseRiskData } from 'lib/utils';
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
