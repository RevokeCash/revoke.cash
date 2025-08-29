import { memo, useState, useEffect, useRef } from 'react';
// Import ChainLogo directly
import ChainLogo from '@/shared-components/common/ChainLogo';
import {
  CHAIN_SELECT_MAINNETS,
  CHAIN_SELECT_TESTNETS,
  getChainName,
  isSupportedChain,
} from '@/shared-lib/utils/chains';

interface ChainOption {
  value: string;
  chainId: number;
}

interface Props {
  selected?: number;
  chainIds?: number[];
  onSelect?: (chainId: number) => void;
  showNames?: boolean;
}

const ChainSelect = ({ onSelect, selected, chainIds, showNames = true }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const mainnetOptions = (chainIds ?? CHAIN_SELECT_MAINNETS.slice(0, 10)).map((chainId) => ({
    value: getChainName(chainId),
    chainId,
  }));

  const testnetOptions = CHAIN_SELECT_TESTNETS.slice(0, 5).map((chainId) => ({
    value: getChainName(chainId),
    chainId,
  }));

  const allOptions = [...mainnetOptions, ...testnetOptions];
  const selectedOption = allOptions.find((option) => option.chainId === selected);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (chainId: number) => {
    onSelect?.(chainId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Chain Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 py-2 px-3 bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 
          border border-black dark:border-white rounded-lg text-sm font-medium 
          cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors
          min-w-[120px] w-full justify-between"
      >
        <div className="flex items-center gap-2">
          {selectedOption && <ChainLogo chainId={selectedOption.chainId} size={20} />}
          {showNames && <span className="truncate">{selectedOption ? selectedOption.value : 'Select Chain'}</span>}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-black 
          border border-black dark:border-white rounded-lg shadow-lg z-50 
          max-h-64 overflow-y-auto"
        >
          {/* Mainnets */}
          <div className="px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
            Mainnets
          </div>
          {mainnetOptions.map((option) => (
            <button
              key={option.chainId}
              onClick={() => handleSelect(option.chainId)}
              disabled={!isSupportedChain(option.chainId)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 
                transition-colors text-sm ${
                  !isSupportedChain(option.chainId) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  selected === option.chainId
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
            >
              <ChainLogo chainId={option.chainId} size={20} />
              <span className="truncate">{option.value}</span>
              {selected === option.chainId && (
                <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}

          {/* Testnets */}
          <div className="px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 border-t border-zinc-100 dark:border-t-zinc-800">
            Testnets
          </div>
          {testnetOptions.map((option) => (
            <button
              key={option.chainId}
              onClick={() => handleSelect(option.chainId)}
              disabled={!isSupportedChain(option.chainId)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 
                transition-colors text-sm ${
                  !isSupportedChain(option.chainId) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  selected === option.chainId
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
            >
              <ChainLogo chainId={option.chainId} size={20} />
              <span className="truncate">{option.value}</span>
              {selected === option.chainId && (
                <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(ChainSelect);
