import { ChainTokenMapping, TokenMapping } from 'lib/interfaces';
import erc20TokenMapping from './erc20-token-mapping.json';
import nftTokenMapping from './nft-token-mapping.json';

const mergeTokenMappings = (mappings: TokenMapping[]): TokenMapping => {
  const mergedMapping = {};

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

const mergeChainsForTokenMapping = (mapping: TokenMapping): ChainTokenMapping => {
  const mergedChains = Object.values(mapping).reduce((acc, tokens) => {
    return { ...acc, ...tokens };
  }, {});

  return mergedChains;
};

export const TOKEN_MAPPING = mergeTokenMappings([nftTokenMapping, erc20TokenMapping]);
export const ALL_TOKENS_MAPPING = mergeChainsForTokenMapping(TOKEN_MAPPING);
