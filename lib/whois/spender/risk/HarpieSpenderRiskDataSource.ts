import { HARPIE_API_KEY } from 'lib/constants';
import { SpenderRiskData } from 'lib/interfaces';
import { Address } from 'viem';
import { SpenderDataSource } from '../SpenderDataSource';

export class HarpieSpenderRiskDataSource implements SpenderDataSource {
  async getSpenderData(address: Address, chainId: number): Promise<SpenderRiskData | null> {
    const apiKey = HARPIE_API_KEY;
    if (!apiKey || chainId !== 1) return null;

    try {
      const time = new Date().getTime();

      // Note: there's a bug in Vercel Edge runtime + Ky that causes Ky not to work in Edge runtime with POST requests
      const res = await fetch('https://api.harpie.io/v2/validateAddress', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey, address }),
      });

      const data = await res.json();
      const riskFactors = data.isMaliciousAddress ? ['blocklist_harpie'] : [];

      const elapsedTime = (new Date().getTime() - time) / 1000;
      console.log(elapsedTime, 'Harpie', address);

      return { riskFactors };
    } catch (e) {
      console.error('Err', e);
      return null;
    }
  }
}
