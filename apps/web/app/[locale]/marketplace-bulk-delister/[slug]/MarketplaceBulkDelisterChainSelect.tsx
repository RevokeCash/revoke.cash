'use client';

import type { ChainId } from '@revoke.cash/chains';
import ChainSelectHref from 'components/common/select/ChainSelectHref';
import { OPENSEA_CHAINS } from 'lib/hooks/ethereum/useMarketplaces';
import { CHAIN_SELECT_MAINNETS, getChainSlug } from 'lib/utils/chains';
import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface Props {
  chainId: number;
}

// This is a wrapper around ChainSelectHref because we cannot pass the getUrl function as a prop from a server component
const MarketplaceBulkDelisterChainSelect = ({ chainId }: Props) => {
  const searchParams = useSearchParams();
  const chains = CHAIN_SELECT_MAINNETS.filter((chainId) => OPENSEA_CHAINS.includes(chainId as ChainId));

  const getUrl = useCallback(
    (chainId: number) => {
      const qs = searchParams.toString();
      return `/marketplace-bulk-delister/${getChainSlug(chainId)}${qs ? `?${qs}` : ''}`;
    },
    [searchParams],
  );

  return (
    <ChainSelectHref
      instanceId="marketplace-bulk-delister-chain-select"
      selected={chainId}
      getUrl={getUrl}
      showNames
      chainIds={chains}
    />
  );
};

export default MarketplaceBulkDelisterChainSelect;
