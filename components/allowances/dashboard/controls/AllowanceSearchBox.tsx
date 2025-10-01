'use client';

import { XCircleIcon } from '@heroicons/react/24/outline';
import type { Table } from '@tanstack/react-table';
import Button from 'components/common/Button';
import FocusTrap from 'components/common/FocusTrap';
import SearchBox from 'components/common/SearchBox';
import useDebouncedValue from 'lib/hooks/useDebouncedValue';
import type { TokenAllowanceData } from 'lib/utils/allowances';
import { updateTableFilters } from 'lib/utils/table';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { type ChangeEventHandler, useEffect, useState } from 'react';
import { ColumnId } from '../columns';

interface Props {
  table: Table<TokenAllowanceData>;
}

const AllowanceSearchBox = ({ table }: Props) => {
  const searchParams = useSearchParams()!;
  const t = useTranslations();
  const [inputValue, setInputValue] = useState<string>('');
  const [searchValue, { flushWith }] = useDebouncedValue(inputValue, 200);

  // Allow passing in a spenderSearch query param to pre-populate the search box (cleared on mount)
  // Note that this should be carefully tested with the query param handling in AddressPageContext.tsx when updated
  useEffect(() => {
    const spenderSearch = searchParams.get('spenderSearch');
    if (!spenderSearch) return;

    setInputValue(spenderSearch);

    // Clear the query param
    const newSearchParams = new URLSearchParams(Array.from(searchParams.entries()));
    newSearchParams.delete('spenderSearch');
    window.history.replaceState(window.history.state, '', `?${newSearchParams.toString()}`);
  }, [searchParams]);

  useEffect(() => {
    const values = searchValue
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    const tableFilters = values.length > 0 ? [{ id: ColumnId.SPENDER, value: values }] : [];
    const ignoreIds = Object.values(ColumnId).filter((id) => id !== ColumnId.SPENDER);

    updateTableFilters(table, tableFilters, ignoreIds);
  }, [table, searchValue]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setInputValue(event.target.value);
  };

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
      id="spender-search"
      onSubmit={(event) => event.preventDefault()}
      onChange={handleChange}
      value={inputValue}
      placeholder={t('address.search.spender')}
      className="w-full"
    >
      <FocusTrap />
      {inputValue.trim().length > 0 && resetButton}
    </SearchBox>
  );
};

export default AllowanceSearchBox;
