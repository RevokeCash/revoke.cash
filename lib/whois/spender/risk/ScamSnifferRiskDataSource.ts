import ky from 'ky';
import { WHOIS_BASE_URL } from 'lib/constants';
import { SpenderRiskData } from 'lib/interfaces';
import md5 from 'md5';
import { Address } from 'viem';
import { SpenderDataSource } from '../SpenderDataSource';

export class ScamSnifferRiskDataSource implements SpenderDataSource {
  async getSpenderData(address: Address, chainId: number): Promise<SpenderRiskData | null> {
    const identifier = md5(`revokecash:${address.toLowerCase()}`);

    try {
      const time = new Date().getTime();
      const riskData = await ky
        .get(`${WHOIS_BASE_URL}/spenders/scamsniffer/${identifier}.json`)
        .json<SpenderRiskData>();
      const elapsedTime = (new Date().getTime() - time) / 1000;

      console.log(elapsedTime, 'ScamSniffer', address);

      return riskData;
    } catch {
      return null;
    }
  }
}
