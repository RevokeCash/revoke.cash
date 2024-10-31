'use client';

import ChainSelectHref from 'components/common/select/ChainSelectHref';
import { getChainSlug } from 'lib/utils/chains';
import { useCallback } from 'react';

interface Props {
  chainId: number;
}

// This is a wrapper around ChainSelectHref because we cannot pass the getUrl function as a prop from a server component
const AddNetworkChainSelect = ({ chainId }: Props) => {
  const getUrl = useCallback((chainId) => `/learn/wallets/add-network/${getChainSlug(chainId)}`, []);
  return <ChainSelectHref instanceId="add-network-chain-select" selected={chainId} getUrl={getUrl} showNames />;
};

export default AddNetworkChainSelect;
