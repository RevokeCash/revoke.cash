'use client';

import { getChainName } from '@revoke.cash/core/chains';
import ChainLogo from 'components/common/ChainLogo';
import ChainStatusIndicator from 'components/common/ChainStatusIndicator';
import type { ReactNode } from 'react';

interface Props {
  chainId: number;
  status: 'loading' | 'success' | 'error';
  error: Error | null;
  isRefreshing?: boolean;
  refetch: () => void | Promise<void>;
  children: ReactNode;
}

const ChainSectionHeader = ({ chainId, status, error, isRefreshing, refetch, children }: Props) => {
  const chainName = getChainName(chainId);

  return (
    <div className="w-full flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        <ChainLogo chainId={chainId} size={28} />
        <span className="font-medium text-base truncate">{chainName}</span>
      </div>
      <div className="flex items-center gap-4 min-w-0">
        <ChainStatusIndicator
          status={status}
          chainId={chainId}
          error={error}
          isRefreshing={isRefreshing}
          refetch={refetch}
        >
          {children}
        </ChainStatusIndicator>
      </div>
    </div>
  );
};

export default ChainSectionHeader;
