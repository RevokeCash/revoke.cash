'use client';

import ChainLogo from 'components/common/ChainLogo';
import Chevron from 'components/common/Chevron';
import type { ChainAllowanceData } from 'lib/hooks/page-context/PremiumAddressPageContext';
import { getChainName } from 'lib/utils/chains';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  emptyChains: ChainAllowanceData[];
}

const EmptyChainsSection = ({ emptyChains }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (emptyChains.length === 0) return null;

  return (
    <div
      className={twMerge('rounded-lg border border-black dark:border-white bg-white dark:bg-zinc-900 overflow-hidden')}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Stack of chain logos */}
          <div className="flex items-center -space-x-2 shrink-0">
            {emptyChains.slice(0, 5).map((chain) => (
              <div
                key={chain.chainId}
                className="rounded-full bg-white dark:bg-zinc-900 ring-2 ring-white dark:ring-zinc-900"
              >
                <ChainLogo chainId={chain.chainId} size={24} />
              </div>
            ))}
            {emptyChains.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium ring-2 ring-white dark:ring-zinc-900">
                +{emptyChains.length - 5}
              </div>
            )}
          </div>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {emptyChains.length} {emptyChains.length === 1 ? 'network' : 'networks'} with no approvals
          </span>
        </div>

        <Chevron
          className={twMerge(
            'w-5 h-5 transition-transform fill-zinc-400 dark:fill-zinc-500 shrink-0',
            isExpanded && 'rotate-180',
          )}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-3 border-t border-zinc-200 dark:border-zinc-700">
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
        </div>
      )}
    </div>
  );
};

export default EmptyChainsSection;
