import { TokenMapping } from 'lib/interfaces';
import erc20TokenMapping from './erc20-token-mapping.json';
import nftTokenMapping from './nft-token-mapping.json';

const mergeTokenMappings = (mappings: TokenMapping[]): TokenMapping => {
  const mergedMapping: TokenMapping = {};

  for (const mapping of mappings) {
    for (const chainId in mapping) {
      if (mergedMapping[chainId] === undefined) {
        mergedMapping[chainId] = {};
      }

      mergedMapping[chainId] = { ...mergedMapping[chainId], ...mapping[chainId] };
    }
  }

  return mergedMapping;
};

export const TOKEN_MAPPING = mergeTokenMappings([erc20TokenMapping, nftTokenMapping]);
