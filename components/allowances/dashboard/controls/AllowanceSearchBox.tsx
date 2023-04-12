import { XCircleIcon } from '@heroicons/react/24/outline';
import { Table } from '@tanstack/react-table';
import Button from 'components/common/Button';
import SearchBox from 'components/common/SearchBox';
import { AllowanceData } from 'lib/interfaces';
import { updateTableFilters } from 'lib/utils/table';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import { ChangeEventHandler, useEffect, useState } from 'react';
import { ColumnId } from '../columns';

interface Props {
  table: Table<AllowanceData>;
}

const AllowanceSearchBox = ({ table }: Props) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchValues, setSearchValues] = useState<string[]>([]);

  // Allow passing in a spenderSearch query param to pre-populate the search box (cleared on mount)
  useEffect(() => {
    const search = router.query.spenderSearch as string;
    if (search !== undefined) {
      setSearchValues(search.split(','));

      // Clear the query param
      const query = { ...router.query };
      delete query.spenderSearch;
      router.replace({ query }, undefined, { shallow: true });
    }
  }, [router.query]);

  useEffect(() => {
    const tableFilter = { id: ColumnId.SPENDER, value: searchValues.filter(Boolean).map((value) => value.trim()) };
    const tableFilters = tableFilter.value.length > 0 ? [tableFilter] : [];
    const ignoreIds = Object.values(ColumnId).filter((id) => id !== ColumnId.SPENDER);
    updateTableFilters(table, tableFilters, ignoreIds);
  }, [searchValues]);

  // If filters are cleared externally then we update the search box to match that
  useEffect(() => {
    if (table.getState().columnFilters.length === 0 && searchValues.length > 0) setSearchValues([]);
  }, [table.getState()]);

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
      onSubmit={(event) => event.preventDefault()}
      onChange={handleChange}
      value={searchValues.join(',')}
      placeholder={t('address:search.spender')}
      className="w-full"
    >
      {searchValues.filter(Boolean).length > 0 && resetButton}
    </SearchBox>
  );
};

export default AllowanceSearchBox;
