import { Table } from '@tanstack/react-table';
import { useEthereum } from 'lib/hooks/useEthereum';
import type { AllowanceData } from 'lib/interfaces';
import ChainSelect from '../header/ChainSelect';
import FilterSelect from './FilterSelect';
import SortSelect from './SortSelect';

interface Props {
  table: Table<AllowanceData>;
}

const AllowanceTableHeader = ({ table }: Props) => {
  const { selectedChainId, selectChain } = useEthereum();

  return (
    <div className="flex justify-start gap-2">
      <ChainSelect selected={selectedChainId} onSelect={selectChain} showName />
      <SortSelect table={table} />
      <FilterSelect table={table} />
    </div>
  );
};

export default AllowanceTableHeader;
