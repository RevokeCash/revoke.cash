import { useQuery } from '@tanstack/react-query';
import ChainSelect from 'components/common/ChainSelect';
import Label from 'components/common/Label';
import { useAddressContext } from 'lib/hooks/useAddressContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import { classNames } from 'lib/utils/styles';
import useTranslation from 'next-translate/useTranslation';
import AddressDisplay from './AddressDisplay';
import AddressSocialShareButtons from './AddressSocialShareButtons';
import BalanceDisplay from './BalanceDisplay';

const AddressHeader = () => {
  const { t } = useTranslation();
  const { address, domainName } = useAddressContext();
  const { selectedChainId, selectChain, readProvider, account } = useEthereum();

  const { data: balance } = useQuery({
    queryKey: ['balance', address, selectedChainId],
    queryFn: () => readProvider.getBalance(address).then((balance) => balance.toString()),
  });

  return (
    <div className="mb-2 flex flex-col sm:flex-row justify-between items-center gap-2 border border-black rounded-lg px-4 py-3">
      <div className="flex flex-col gap-2 items-center sm:items-start">
        <AddressDisplay address={address} domainName={domainName} className="text-2xl font-bold" />
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <BalanceDisplay balance={balance} />
            <div className="leading-none">&bull;</div>
            <AddressDisplay address={address} className="" copy />
          </div>
          <Label
            className={classNames(address === account ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-900', '')}
          >
            {address === account ? t('address:labels.connected') : t('address:labels.not_connected')}
          </Label>
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
