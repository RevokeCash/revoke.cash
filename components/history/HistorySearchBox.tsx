'use client';

import { XCircleIcon } from '@heroicons/react/24/outline';
import type { Table } from '@tanstack/react-table';
import Button from 'components/common/Button';
import FocusTrap from 'components/common/FocusTrap';
import SearchBox from 'components/common/SearchBox';
import useDebouncedValue from 'lib/hooks/useDebouncedValue';
import { updateTableFilters } from 'lib/utils/table';
import { useTranslations } from 'next-intl';
import { type ChangeEventHandler, forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { ColumnId } from './columns';
import type { ApprovalHistoryEvent } from './utils';

interface Props {
  table: Table<ApprovalHistoryEvent>;
}

export interface HistorySearchBoxRef {
  setInputValue: (value: string) => void;
}

const HistorySearchBox = forwardRef<HistorySearchBoxRef, Props>(({ table }, ref) => {
  const t = useTranslations();
  const [inputValue, setInputValue] = useState<string>('');
  const [searchValue, { flushWith }] = useDebouncedValue(inputValue, 200);

  useImperativeHandle(ref, () => ({
    setInputValue,
  }));

  useEffect(() => {
    const terms = searchValue.trim().split(',').filter(Boolean);

    const tableFilters = [];

    const categorisedTerms = terms.reduce<Record<string, string[]>>(
      (acc, term) => {
        if (term.trim().startsWith('spender:')) {
          acc.spenderTerms.push(term.substring(8).trim());
        } else if (term.trim().startsWith('token:')) {
          acc.tokenTerms.push(term.substring(6).trim());
        } else {
          acc.combinedTerms.push(term);
        }
        return acc;
      },
      { spenderTerms: [], tokenTerms: [], combinedTerms: [] },
    );

    if (categorisedTerms.spenderTerms.length > 0) {
      tableFilters.push({ id: ColumnId.SPENDER, value: categorisedTerms.spenderTerms });
    }

    if (categorisedTerms.tokenTerms.length > 0) {
      tableFilters.push({ id: ColumnId.ASSET, value: categorisedTerms.tokenTerms });
    }

    if (categorisedTerms.combinedTerms.length > 0) {
      tableFilters.push({ id: ColumnId.COMBINED_SEARCH, value: categorisedTerms.combinedTerms });
    }

    const ignoreIds = Object.values(ColumnId).filter(
      (id) => id !== ColumnId.SPENDER && id !== ColumnId.ASSET && id !== ColumnId.COMBINED_SEARCH,
    );

    updateTableFilters(table, tableFilters, ignoreIds);
  }, [table, searchValue]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    setInputValue(event.target.value);
  }, []);

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
  );
});

HistorySearchBox.displayName = 'HistorySearchBox';

export default HistorySearchBox;
