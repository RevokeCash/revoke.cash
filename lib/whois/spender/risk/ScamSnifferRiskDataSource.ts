import ky from 'ky';
import { WHOIS_BASE_URL } from 'lib/constants';
import type { SpenderRiskData } from 'lib/interfaces';
import { normaliseRiskData } from 'lib/utils';
import md5 from 'md5';
import type { Address } from 'viem';
import type { SpenderDataSource } from '../SpenderDataSource';

export class ScamSnifferRiskDataSource implements SpenderDataSource {
  async getSpenderData(address: Address, _chainId: number): Promise<SpenderRiskData | null> {
    const identifier = md5(`revokecash:${address.toLowerCase()}`);

    try {
      const time = new Date().getTime();
      const riskData = await ky.get(`${WHOIS_BASE_URL}/spenders/scamsniffer/${identifier}.json`).json<any>();
      const elapsedTime = (new Date().getTime() - time) / 1000;

      console.log(elapsedTime, 'ScamSniffer', address);

      return normaliseRiskData(riskData, 'scamsniffer');
    } catch {
      return null;
    }
  }
}
