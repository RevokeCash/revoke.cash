import { HARPIE_API_KEY } from 'lib/constants';
import { SpenderData } from 'lib/interfaces';
import { Address } from 'viem';
import { SpenderDataSource } from '../SpenderDataSource';

// TODO: Does this work from server environment?
export class HarpieSpenderDataSource implements SpenderDataSource {
  async getSpenderData(address: Address, chainId: number): Promise<SpenderData | null> {
    const apiKey = HARPIE_API_KEY;
    if (!apiKey || chainId !== 1) return null;

    try {
      // Note: there's a bug in Vercel Edge runtime + Ky that causes Ky not to work in Edge runtime with POST requests
      const res = await fetch('https://api.harpie.io/getprotocolfromcontract', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey, address }),
      });

      const data = await res.json();

      if (!data?.contractOwner || data?.contractOwner === 'NO_DATA') return null;
      return { name: data.contractOwner };
    } catch (e) {
      console.log('harpie', e);
      return null;
    }
  }
}
