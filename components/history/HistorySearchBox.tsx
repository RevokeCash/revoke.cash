'use client';

import { XCircleIcon } from '@heroicons/react/24/outline';
import type { Table } from '@tanstack/react-table';
import Button from 'components/common/Button';
import FocusTrap from 'components/common/FocusTrap';
import SearchBox from 'components/common/SearchBox';
import useDebouncedValue from 'lib/hooks/useDebouncedValue';
import { updateTableFilters } from 'lib/utils/table';
import { useTranslations } from 'next-intl';
import {
  type ChangeEventHandler,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import { ColumnId } from './columns';
import HistoryChainMultiSelect from './HistoryChainMultiSelect';
import type { ApprovalHistoryEvent } from './utils';

interface Props {
  table: Table<ApprovalHistoryEvent>;
  isPremium?: boolean;
}

export interface HistorySearchBoxRef {
  setInputValue: (value: string) => void;
}

const SPENDER_PREFIX = 'spender:';
const TOKEN_PREFIX = 'token:';
const CHAIN_PREFIX = 'chain:';

interface CategorisedTerms {
  spenderTerms: string[];
  tokenTerms: string[];
  chainTerms: string[];
  combinedTerms: string[];
}

const parseSearchTerms = (searchTerm: string): CategorisedTerms => {
  return searchTerm
    .trim()
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean)
    .reduce<CategorisedTerms>(
      (acc, term) => {
        const lowerTerm = term.toLowerCase();

        if (lowerTerm.startsWith(SPENDER_PREFIX)) {
          const value = term.slice(SPENDER_PREFIX.length).trim();
          if (value) acc.spenderTerms.push(value);
        } else if (lowerTerm.startsWith(TOKEN_PREFIX)) {
          const value = term.slice(TOKEN_PREFIX.length).trim();
          if (value) acc.tokenTerms.push(value);
        } else if (lowerTerm.startsWith(CHAIN_PREFIX)) {
          const value = term.slice(CHAIN_PREFIX.length).trim();
          if (value) acc.chainTerms.push(value);
        } else {
          acc.combinedTerms.push(term);
        }

        return acc;
      },
      { spenderTerms: [], tokenTerms: [], chainTerms: [], combinedTerms: [] },
    );
};

const HistorySearchBox = forwardRef<HistorySearchBoxRef, Props>(({ table, isPremium = false }, ref) => {
  const t = useTranslations();
  const [inputValue, setInputValue] = useState<string>('');
  const [searchValue, { flushWith }] = useDebouncedValue(inputValue, 200);

  const chainTerms = useMemo(() => parseSearchTerms(inputValue).chainTerms, [inputValue]);

  useImperativeHandle(ref, () => ({
    setInputValue,
  }));

  useEffect(() => {
    const tableFilters = [];
    const categorisedTerms = parseSearchTerms(searchValue);

    if (categorisedTerms.spenderTerms.length > 0) {
      tableFilters.push({ id: ColumnId.SPENDER, value: categorisedTerms.spenderTerms });
    }

    if (categorisedTerms.tokenTerms.length > 0) {
      tableFilters.push({ id: ColumnId.ASSET, value: categorisedTerms.tokenTerms });
    }

    if (categorisedTerms.combinedTerms.length > 0) {
      tableFilters.push({ id: ColumnId.COMBINED_SEARCH, value: categorisedTerms.combinedTerms });
    }

    if (categorisedTerms.chainTerms.length > 0) {
      tableFilters.push({ id: ColumnId.CHAIN, value: categorisedTerms.chainTerms });
    }

    const ignoreIds = Object.values(ColumnId).filter(
      (id) =>
        id !== ColumnId.SPENDER && id !== ColumnId.ASSET && id !== ColumnId.COMBINED_SEARCH && id !== ColumnId.CHAIN,
    );

    updateTableFilters(table, tableFilters, ignoreIds);
  }, [table, searchValue]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    setInputValue(event.target.value);
  }, []);

  const handleChainTermsChange = useCallback(
    (nextChainTerms: string[]) => {
      const nonChainTerms = inputValue
        .split(',')
        .map((term) => term.trim())
        .filter(Boolean)
        .filter((term) => !term.toLowerCase().startsWith(CHAIN_PREFIX));

      const chainSearchTerms = nextChainTerms.map((chainTerm) => `${CHAIN_PREFIX}${chainTerm}`);
      const nextInput = [...nonChainTerms, ...chainSearchTerms].join(', ');

      setInputValue(nextInput);
      flushWith(nextInput);
    },
    [flushWith, inputValue],
  );

  const resetButton = (
    <Button
      style="tertiary"
      onClick={() => {
        setInputValue('');
        flushWith('');
      }}
      size="none"
    >
      <XCircleIcon className="w-6 h-6" />
    </Button>
  );

  return (
    <div className="flex flex-col sm:flex-row gap-2 p-4">
      <SearchBox
        id="history-search"
        onSubmit={(event) => event.preventDefault()}
        onChange={handleChange}
        value={inputValue}
        placeholder={t('address.search.history')}
        className="w-full"
      >
        <FocusTrap />
        {inputValue.trim().length > 0 && resetButton}
      </SearchBox>
      {isPremium ? (
        <HistoryChainMultiSelect chainTerms={chainTerms} onChainTermsChange={handleChainTermsChange} />
      ) : null}
    </div>
  );
});

HistorySearchBox.displayName = 'HistorySearchBox';

export default HistorySearchBox;
