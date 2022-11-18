import { track } from '@amplitude/analytics-browser';
import { useAppContext } from 'lib/hooks/useAppContext';
import { useEthereum } from 'lib/hooks/useEthereum';
import { parseInputAddress } from 'lib/utils';
import useTranslation from 'next-translate/useTranslation';
import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';

const AddressInput = () => {
  const { t } = useTranslation();
  const [inputAddressOrName, setInputAddressOrName] = useState<string>('');
  const { inputAddress, setInputAddress } = useAppContext();

  const { account, ensName, unsName } = useEthereum();
  const domainName = ensName ?? unsName;

  // Replace the input with the connected account if nothing was connected before
  // These checks make it so that you can still enter a new input afterwards
  useEffect(() => {
    if (!account) return;
    if (inputAddress && inputAddress !== account) return;

    setInputAddressOrName(domainName || account || inputAddressOrName);
  }, [domainName, account, inputAddress]);

  useEffect(() => {
    const updateInputAddress = async () => {
      const newInputAddress = await parseInputAddress(inputAddressOrName);
      if (newInputAddress && newInputAddress !== inputAddress) {
        setInputAddress(newInputAddress);
        track('Updated Address', { address: newInputAddress });
      }
    };

    updateInputAddress();
  }, [inputAddressOrName, inputAddress]);

  const handleFormInputChanged = async (event: ChangeEvent<HTMLInputElement>) => {
    setInputAddressOrName(event.target.value);
  };

  return (
    <div>
      <form onSubmit={(e) => e.preventDefault()} className="flex h-10">
        <input
          className="border rounded-md mx-auto w-full text-center text-lg font-semibold focus:outline-none"
          placeholder={t('dashboard:address_input')}
          value={inputAddressOrName}
          onChange={handleFormInputChanged}
          onDoubleClick={() => {
            // Re-enable double-click to select
            return;
          }}
        ></input>
      </form>
    </div>
  );
};

export default AddressInput;
