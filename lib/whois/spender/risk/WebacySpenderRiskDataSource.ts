import { ChainId } from '@revoke.cash/chains';
import ky from 'ky';
import { WEBACY_API_KEY } from 'lib/constants';
import { RiskFactor, SpenderRiskData } from 'lib/interfaces';
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
      const UNSAFE_TAGS = ['can_take_back_ownership', 'transfer_without_approval', 'restricted_approval'];

      const BLOCKLIST_CATEGORIES = ['contract_reported', 'possible_drainer'];
      const UNSAFE_CATEGORIES = [
        'poor_developer_practices',
        'contract_brickable',
        'contract_issues',
        'financially_lopsided',
        'improper_signature_validation',
      ];

      // Note: We're ignoring fraudulent_malicious since it is too braod. Instead we check for specific tags
      const IGNORE_CATEGORIES = [
        'governance_issues',
        'miner_manipulable',
        'address_characteristics',
        'fraudulent_malicious',
      ];

      const riskFactors: RiskFactor[] = (data?.issues ?? []).flatMap((issue) => {
        const tags = issue?.tags?.map((tag: any) => tag.key) as string[];

        const tagFactors = tags.flatMap((tag) => {
          if (tag === 'is_closed_source') return [{ type: 'closed_source', source: 'webacy' }];
          if (UNSAFE_TAGS.includes(tag)) return [{ type: 'unsafe', source: 'webacy' }];
          if (BLOCKLIST_TAGS.includes(tag)) return [{ type: 'blocklist', source: 'webacy' }];
          return [];
        });

        const categoryFactors = Object.keys(issue?.categories ?? {}).flatMap((category: string) => {
          if (IGNORE_CATEGORIES.includes(category)) return [];
          if (UNSAFE_CATEGORIES.includes(category)) return [{ type: 'unsafe', source: 'webacy' }];
          if (BLOCKLIST_CATEGORIES.includes(category)) return [{ type: 'blocklist', source: 'webacy' }];
          return [{ type: category, source: 'webacy' }];
        });

        return [...tagFactors, ...categoryFactors];
      });

      return { riskFactors };
    } catch {
      return null;
    }
  }
}
