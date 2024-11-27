'use client';

import { XCircleIcon } from '@heroicons/react/24/outline';
import type { Table } from '@tanstack/react-table';
import Button from 'components/common/Button';
import FocusTrap from 'components/common/FocusTrap';
import SearchBox from 'components/common/SearchBox';
import type { AllowanceData } from 'lib/interfaces';
import { updateTableFilters } from 'lib/utils/table';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { type ChangeEventHandler, useEffect, useState } from 'react';
import { ColumnId } from '../columns';

interface Props {
  table: Table<AllowanceData>;
}

const AllowanceSearchBox = ({ table }: Props) => {
  const searchParams = useSearchParams();
  const t = useTranslations();
  const [searchValues, setSearchValues] = useState<string[]>([]);

  // Allow passing in a spenderSearch query param to pre-populate the search box (cleared on mount)
  // Note that this should be carefully tested with the query param handling in AddressPageContext.tsx when updated
  useEffect(() => {
    const spenderSearch = searchParams.get('spenderSearch');
    if (!spenderSearch) return;

    setSearchValues(spenderSearch.split(','));

    // Clear the query param
    const newSearchParams = new URLSearchParams(Array.from(searchParams.entries()));
    newSearchParams.delete('spenderSearch');
    window.history.replaceState(window.history.state, '', `?${newSearchParams.toString()}`);
  }, [searchParams]);

  useEffect(() => {
    const tableFilter = { id: ColumnId.SPENDER, value: searchValues.filter(Boolean).map((value) => value.trim()) };
    const tableFilters = tableFilter.value.length > 0 ? [tableFilter] : [];
    const ignoreIds = Object.values(ColumnId).filter((id) => id !== ColumnId.SPENDER);
    updateTableFilters(table, tableFilters, ignoreIds);
  }, [searchValues]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const values = event.target.value.trim().split(',');
    setSearchValues(values);
  };

  const resetButton = (
    <Button style="tertiary" onClick={() => setSearchValues([])} size="none">
      <XCircleIcon className="w-6 h-6" />
    </Button>
  );

  return (
    <SearchBox
      id="spender-search"
      onSubmit={(event) => event.preventDefault()}
      onChange={handleChange}
      value={searchValues.join(',')}
      placeholder={t('address.search.spender')}
      className="w-full"
    >
      <FocusTrap />
      {searchValues.filter(Boolean).length > 0 && resetButton}
    </SearchBox>
  );
};

export default AllowanceSearchBox;
