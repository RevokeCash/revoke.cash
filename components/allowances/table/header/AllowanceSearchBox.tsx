import { Table } from '@tanstack/react-table';
import SearchBox from 'components/common/SearchBox';
import { AllowanceData } from 'lib/interfaces';
import { updateTableFilters } from 'lib/utils/table';
import useTranslation from 'next-translate/useTranslation';
import { ChangeEventHandler, useEffect, useState } from 'react';
import { ColumnId } from '../columns';

interface Props {
  table: Table<AllowanceData>;
}

const AllowanceSearchBox = ({ table }: Props) => {
  const { t } = useTranslation();
  const [searchValues, setSearchValues] = useState<string[]>([]);

  useEffect(() => {
    const tableFilter = { id: ColumnId.SPENDER, value: searchValues.filter((value) => value !== '') };
    const tableFilters = tableFilter.value.length > 0 ? [tableFilter] : [];
    const ignoreIds = Object.values(ColumnId).filter((id) => id !== ColumnId.SPENDER);
    updateTableFilters(table, tableFilters, ignoreIds);
  }, [searchValues]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const values = event.target.value.trim().split(',');
    setSearchValues(values);
  };

  return (
    <SearchBox
      onSubmit={(event) => event.preventDefault()}
      onChange={handleChange}
      value={searchValues.join(',')}
      placeholder={t('address:search.spender')}
      className="w-full"
    />
  );
};

export default AllowanceSearchBox;
