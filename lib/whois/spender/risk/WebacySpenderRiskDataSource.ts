import { ChainId } from '@revoke.cash/chains';
import ky from 'ky';
import { WEBACY_API_KEY } from 'lib/constants';
import { RiskFactor, SpenderRiskData } from 'lib/interfaces';
import { deduplicateArray } from 'lib/utils';
import { Address } from 'viem';
import { SpenderDataSource } from '../SpenderDataSource';

export class WebacySpenderRiskDataSource implements SpenderDataSource {
  async getSpenderData(address: Address, chainId: number): Promise<SpenderRiskData | null> {
    const chainIdentifiers = {
      [ChainId.EthereumMainnet]: 'eth',
      [ChainId.Base]: 'base',
      [ChainId.BNBSmartChainMainnet]: 'bsc',
      [ChainId.PolygonMainnet]: 'pol',
      [ChainId.OPMainnet]: 'opt',
    };

    const chainIdentifier = chainIdentifiers[chainId];
    if (!chainIdentifier || !WEBACY_API_KEY) return null;

    try {
      const time = new Date().getTime();
      const data = await ky
        .get(`https://api.webacy.com/addresses/${address}?chain=${chainIdentifier}`, {
          headers: { 'x-api-key': WEBACY_API_KEY },
        })
        .json<any>();

      const elapsedTime = (new Date().getTime() - time) / 1000;
      console.log(elapsedTime, 'Webacy', address);

      const BLOCKLIST_TAGS = ['blacklist_doubt', 'stealing_attack', 'phishing_activities', 'is_blacklisted'];
      const BLOCKLIST_CATEGORIES = ['contract_reported', 'possible_drainer'];
      const UNSAFE_CATEGORIES = [
        'poor_developer_practices',
        'contract_brickable',
        'governance_issues',
        'contract_issues',
        'financially_lopsided',
        'improper_signature_validation',
      ];
      const IGNORE_CATEGORIES = ['miner_manipulable', 'address_characteristics', 'fraudulent_malicious']; // Note: We're ignoring fraudulent_malicious since it is too braod. Instead we check for specific tags

      const riskFactors: RiskFactor[] = (data?.issues ?? []).flatMap((issue) => {
        const tags = issue?.tags?.map((tag: any) => tag.key) as string[];

        const tagFactors = tags.flatMap((tag) => {
          if (BLOCKLIST_TAGS.includes(tag)) return [{ type: 'blocklist', source: 'webacy' }];
          return [];
        });

        const categoryFactors = Object.keys(issue?.categories ?? {}).flatMap((category: string) => {
          if (BLOCKLIST_CATEGORIES.includes(category)) return [{ type: 'blocklist', source: 'webacy' }];
          if (UNSAFE_CATEGORIES.includes(category)) return [{ type: 'unsafe', source: 'webacy' }];
          if (IGNORE_CATEGORIES.includes(category)) return [];
          return [{ type: category, source: 'webacy' }];
        });

        return [...tagFactors, ...categoryFactors];
      });

      if (data?.isContract === false) riskFactors.push({ type: 'is_eoa', source: 'webacy' });

      return { riskFactors: deduplicateArray(riskFactors, (a, b) => a.type === b.type) };
    } catch {
      return null;
    }
  }
}
