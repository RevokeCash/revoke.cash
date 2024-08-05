import { WHOIS_BASE_URL } from 'lib/constants';
import { SpenderData } from 'lib/interfaces';
import ky from 'lib/ky';
import { normaliseRiskData } from 'lib/utils';
import { Address, getAddress } from 'viem';
import { SpenderDataSource } from '../SpenderDataSource';

export class WhoisSpenderDataSource implements SpenderDataSource {
  async getSpenderData(address: Address, chainId: number): Promise<SpenderData | null> {
    try {
      const labelData = await ky.get(`${WHOIS_BASE_URL}/spenders/${chainId}/${getAddress(address)}.json`).json<any>();

      if (!labelData || Object.keys(labelData).length === 0) return null;

      return normaliseRiskData(labelData, 'revoke');
    } catch {
      return null;
    }
  }
}
