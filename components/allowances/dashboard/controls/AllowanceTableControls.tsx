import type { Table } from '@tanstack/react-table';
import { useAddressPageContext } from 'lib/hooks/page-context/AddressPageContext';
import type { TokenAllowanceData } from 'lib/utils/allowances';
import { Suspense } from 'react';
import WalletHealthSection from '../wallet-health/WalletHealthSection';
import AllowanceSearchBox from './AllowanceSearchBox';
import FilterSelect from './FilterSelect';
import SortSelect from './SortSelect';

interface Props {
  table: Table<TokenAllowanceData>;
}

const AllowanceTableControls = ({ table }: Props) => {
  const { address, selectedChainId } = useAddressPageContext();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col-reverse md:flex-row justify-start gap-2">
        <div className="flex flex-col justify-start gap-2 grow">
          <SortSelect table={table} />
          <FilterSelect table={table} />
        </div>
        <WalletHealthSection address={address} chainId={selectedChainId} />
      </div>
      <Suspense>
        <AllowanceSearchBox table={table} />
      </Suspense>
    </div>
  );
};

export default AllowanceTableControls;
