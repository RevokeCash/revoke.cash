import { WHOIS_BASE_URL } from '@revoke.cash/core/constants';
import { normaliseRiskData } from '@revoke.cash/core/risk';
import type { SpenderRiskData } from '@revoke.cash/core/whois';
import ky from 'ky';
import md5 from 'md5';
import type { Address } from 'viem';
import type { SpenderDataSource } from '../SpenderDataSource';

export class ScamSnifferRiskDataSource implements SpenderDataSource {
  async getSpenderData(address: Address, _chainId: number): Promise<SpenderRiskData | null> {
    const identifier = md5(`revokecash:${address.toLowerCase()}`);

    try {
      const time = Date.now();
      const riskData = await ky.get(`${WHOIS_BASE_URL}/spenders/scamsniffer/${identifier}.json`).json<any>();
      const elapsedTime = (Date.now() - time) / 1000;

      console.log(elapsedTime, 'ScamSniffer', address);

      return normaliseRiskData(riskData, 'scamsniffer');
    } catch {
      return null;
    }
  }
}
