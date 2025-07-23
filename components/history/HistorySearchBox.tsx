'use client';

import { XCircleIcon } from '@heroicons/react/24/outline';
import type { Table } from '@tanstack/react-table';
import Button from 'components/common/Button';
import FocusTrap from 'components/common/FocusTrap';
import SearchBox from 'components/common/SearchBox';
import type { ApprovalTokenEvent } from 'lib/utils/events';
import { updateTableFilters } from 'lib/utils/table';
import { useTranslations } from 'next-intl';
import { type ChangeEventHandler, useEffect, useState } from 'react';
import { ColumnId } from './columns';

interface Props {
  table: Table<ApprovalTokenEvent>;
}

const HistorySearchBox = ({ table }: Props) => {
  const t = useTranslations();
  const [searchValue, setSearchValue] = useState<string>('');

  useEffect(() => {
    const terms = searchValue.trim().split(',').filter(Boolean);

    const spenderTerms: string[] = [];
    const tokenTerms: string[] = [];
    const hasOnlyPrefixedTerms = terms.every(
      (term) => term.trim().startsWith('spender:') || term.trim().startsWith('token:'),
    );

    terms.forEach((term) => {
      const trimmedTerm = term.trim();

      if (trimmedTerm.startsWith('spender:')) {
        spenderTerms.push(trimmedTerm.substring(8).trim());
      } else if (trimmedTerm.startsWith('token:')) {
        tokenTerms.push(trimmedTerm.substring(6).trim());
      } else {
        // No prefix: search BOTH spenders and tokens
        spenderTerms.push(trimmedTerm);
        tokenTerms.push(trimmedTerm);
      }
    });

    const tableFilters = [];

    if (spenderTerms.length > 0 || tokenTerms.length > 0) {
      if (hasOnlyPrefixedTerms) {
        // Use separate filters for prefixed searches
        if (spenderTerms.length > 0) {
          tableFilters.push({ id: ColumnId.SPENDER, value: spenderTerms });
        }
        if (tokenTerms.length > 0) {
          tableFilters.push({ id: ColumnId.ASSET, value: tokenTerms });
        }
      } else {
        // Use combined filter for unprefixed searches
        tableFilters.push({
          id: ColumnId.COMBINED_SEARCH,
          value: { spenderTerms, tokenTerms },
        });
      }
    }

    const ignoreIds = Object.values(ColumnId).filter(
      (id) => id !== ColumnId.SPENDER && id !== ColumnId.ASSET && id !== ColumnId.COMBINED_SEARCH,
    );

    updateTableFilters(table, tableFilters, ignoreIds);
  }, [table, searchValue]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearchValue(event.target.value);
  };

  const resetButton = (
    <Button style="tertiary" onClick={() => setSearchValue('')} size="none">
      <XCircleIcon className="w-6 h-6" />
    </Button>
  );

  return (
    <SearchBox
      id="history-search"
      onSubmit={(event) => event.preventDefault()}
      onChange={handleChange}
      value={searchValue}
      placeholder={t('address.search.history')}
      className="w-full"
    >
      <FocusTrap />
      {searchValue.trim().length > 0 && resetButton}
    </SearchBox>
  );
};

export default HistorySearchBox;
