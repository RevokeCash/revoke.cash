import { useQuery } from '@tanstack/react-query';
import ChainSelect from 'components/common/ChainSelect';
import { useAddressContext } from 'lib/hooks/useAddressContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import useTranslation from 'next-translate/useTranslation';
import AddressDisplay from './AddressDisplay';
import AddressSocialShareButtons from './AddressSocialShareButtons';
import BalanceDisplay from './BalanceDisplay';
import ConnectedLabel from './ConnectedLabel';

const AddressHeader = () => {
  const { t } = useTranslation();
  const { address, domainName } = useAddressContext();
  const { selectedChainId, selectChain, readProvider, account } = useEthereum();

  const { data: balance } = useQuery({
    queryKey: ['balance', address, selectedChainId],
    queryFn: () => readProvider.getBalance(address).then((balance) => balance.toString()),
  });

  return (
    <div className="mb-2 flex flex-col sm:flex-row justify-between items-center gap-2 border border-black dark:border-white rounded-lg px-4 py-3">
      <div className="flex flex-col gap-2 items-center sm:items-start">
        <AddressDisplay address={address} domainName={domainName} className="text-2xl font-bold" />
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <BalanceDisplay balance={balance} />
            <div className="leading-none">&bull;</div>
            <AddressDisplay address={address} withCopyButton withTooltip />
          </div>
          <ConnectedLabel address={address} />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <AddressSocialShareButtons address={address} />
        <ChainSelect selected={selectedChainId} onSelect={selectChain} />
      </div>
    </div>
  );
};

export default AddressHeader;
