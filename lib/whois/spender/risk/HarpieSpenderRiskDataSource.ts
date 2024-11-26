import { ChainId } from '@revoke.cash/chains';
import { HARPIE_API_KEY } from 'lib/constants';
import type { SpenderRiskData } from 'lib/interfaces';
import type { Address } from 'viem';
import type { SpenderDataSource } from '../SpenderDataSource';

export class HarpieSpenderRiskDataSource implements SpenderDataSource {
  async getSpenderData(address: Address, chainId: number): Promise<SpenderRiskData | null> {
    const apiKey = HARPIE_API_KEY;
    if (!apiKey || chainId !== ChainId.EthereumMainnet) return null;

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

      const elapsedTime = (new Date().getTime() - time) / 1000;
      console.log(elapsedTime, 'Harpie', address);

      const riskFactors = data.isMaliciousAddress ? [{ type: 'blocklist', source: 'harpie' }] : [];
      return { riskFactors };
    } catch (e) {
      console.error('Err', e);
      return null;
    }
  }
}
