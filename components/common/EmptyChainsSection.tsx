'use client';

import ChainLogo from 'components/common/ChainLogo';
import ChainLogoStack from 'components/common/ChainLogoStack';
import CollapsibleCard from 'components/common/CollapsibleCard';
import { getChainName } from 'lib/utils/chains';
import { useState } from 'react';

interface Props {
  emptyChains: Array<{ chainId: number }>;
  description: string;
}

const EmptyChainsSection = ({ emptyChains, description }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (emptyChains.length === 0) return null;

  return (
    <CollapsibleCard
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded((value) => !value)}
      className="border-black dark:border-white bg-white dark:bg-zinc-900"
      headerClassName="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      contentClassName="border-zinc-200 dark:border-zinc-700 px-4 pb-3"
      header={
        <div className="w-full flex items-center gap-3 min-w-0">
          <ChainLogoStack
            chainIds={emptyChains.map((chain) => chain.chainId)}
            maxVisible={5}
            logoSize={24}
            overlapClassName="-space-x-2"
            itemClassName="ring-2"
            overflowClassName="h-6 min-w-6 text-xs bg-zinc-200 dark:bg-zinc-700 ring-2"
          />
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{description}</span>
        </div>
      }
    >
      <div className="flex flex-wrap gap-2 pt-3">
        {emptyChains.map((chain) => (
          <div
            key={chain.chainId}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400"
          >
            <ChainLogo chainId={chain.chainId} size={14} />
            <span>{getChainName(chain.chainId)}</span>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};

export default EmptyChainsSection;
