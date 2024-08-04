import ky from 'ky';
import { WEBACY_API_KEY } from 'lib/constants';
import { SpenderRiskData } from 'lib/interfaces';
import { deduplicateArray } from 'lib/utils';
import { Address } from 'viem';
import { SpenderDataSource } from '../SpenderDataSource';

export class WebacySpenderRiskDataSource implements SpenderDataSource {
  async getSpenderData(address: Address, chainId: number): Promise<SpenderRiskData | null> {
    const chainIdentifiers = {
      1: 'eth',
    };

    const chainIdentifier = chainIdentifiers[chainId];
    if (!chainIdentifier || !WEBACY_API_KEY) return null;

    try {
      const time = new Date().getTime();
      const webacyData = await ky
        .get(`https://api.webacy.com/addresses/${address}?chain=${chainIdentifier}`, {
          headers: { 'x-api-key': WEBACY_API_KEY },
        })
        .json<any>();

      const elapsedTime = (new Date().getTime() - time) / 1000;
      console.log(elapsedTime, 'Webacy', address);

      const BLOCKLIST_TAGS = ['blacklist_doubt', 'phishing_activities'];
      const IGNORE_TAGS = ['insufficient_wallet_balance'];
      const riskFactors = (webacyData?.issues ?? []).flatMap((issue) => {
        const tags = issue?.tags?.map((tag: any) => tag.key) as string[];

        return tags.flatMap((tag) => {
          if (BLOCKLIST_TAGS.includes(tag)) return ['blocklist_webacy'];
          if (IGNORE_TAGS.includes(tag)) return [];
          return [tag];
        });
      });
      if (webacyData?.isContract === false) riskFactors.push('is_eoa');

      return { riskFactors: deduplicateArray(riskFactors) };
    } catch {
      return null;
    }
  }
}
