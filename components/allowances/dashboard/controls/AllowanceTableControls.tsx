import type { Table } from '@tanstack/react-table';
import type { TokenAllowanceData } from 'lib/utils/allowances';
import { Suspense } from 'react';
import AllowanceSearchBox from './AllowanceSearchBox';
import SortSelect from './SortSelect';

interface Props {
  table: Table<TokenAllowanceData>;
}

const AllowanceTableControls = ({ table }: Props) => {
  // TODO: Re-enable wallet health section when it's ready for both contexts
  // const { selectedChainId } = useAddressPageContext();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col-reverse md:flex-row justify-start gap-2">
        <div className="flex flex-col justify-start gap-2 grow">
          <SortSelect table={table} />
          <Suspense>
            <AllowanceSearchBox table={table} />
          </Suspense>
        </div>
        {/* <WalletHealthSection chainId={selectedChainId} /> */}
      </div>
    </div>
  );
};

export default AllowanceTableControls;
