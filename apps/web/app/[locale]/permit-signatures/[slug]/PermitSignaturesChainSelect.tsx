'use client';

import { getChainSlug } from '@revoke.cash/core/chains';
import ChainSelectHref from 'components/common/select/ChainSelectHref';
import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface Props {
  chainId: number;
}

// This is a wrapper around ChainSelectHref because we cannot pass the getUrl function as a prop from a server component
const PermitSignaturesChainSelect = ({ chainId }: Props) => {
  const searchParams = useSearchParams();

  const getUrl = useCallback(
    (chainId: number) => {
      const qs = searchParams.toString();
      return `/permit-signatures/${getChainSlug(chainId)}${qs ? `?${qs}` : ''}`;
    },
    [searchParams],
  );
  return <ChainSelectHref instanceId="permit-signatures-chain-select" selected={chainId} getUrl={getUrl} showNames />;
};

export default PermitSignaturesChainSelect;
