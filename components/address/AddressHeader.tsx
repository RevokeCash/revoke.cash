import { useAddressContext } from 'lib/hooks/useAddressContext';
import AddressDisplay from './AddressDisplay';
import AddressSocialShareButtons from './AddressSocialShareButtons';

const AddressHeader = () => {
  const { address, domainName } = useAddressContext();

  return (
    <div className="mb-2 flex justify-between items-center border border-black rounded-lg px-4 py-3">
      <div className="flex flex-col gap-2">
        <AddressDisplay address={address} domainName={domainName} className="text-2xl font-bold" />
        <div className="flex items-center gap-2">
          <AddressDisplay address={address} className="text-sm text-gray-500" copy />
        </div>
      </div>
      <AddressSocialShareButtons address={address} />
    </div>
  );
};

export default AddressHeader;
