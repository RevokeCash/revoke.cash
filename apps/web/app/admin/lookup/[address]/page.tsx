import AddressDiagnostic from 'components/admin/lookup/AddressDiagnostic';
import LookupSearch from 'components/admin/lookup/LookupSearch';
import { getAddress, isAddress } from 'viem';

interface Props {
  params: Promise<{ address: string }>;
}

const AdminLookupAddressPage = async ({ params }: Props) => {
  const { address } = await params;

  return (
    <div className="flex flex-col gap-6">
      <LookupSearch />
      {isAddress(address, { strict: false }) ? (
        <AddressDiagnostic address={getAddress(address)} />
      ) : (
        <p className="text-sm text-red-600 dark:text-red-400">"{address}" is not a valid address.</p>
      )}
    </div>
  );
};

export default AdminLookupAddressPage;
