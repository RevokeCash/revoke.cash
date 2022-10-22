import { track } from '@amplitude/analytics-browser';
import { useEthereum } from 'lib/hooks/useEthereum';
import { parseInputAddress } from 'lib/utils';
import useTranslation from 'next-translate/useTranslation';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';

interface Props {
  inputAddress: string;
  setInputAddress: (inputAddress: string) => void;
}

const AddressInput: React.FC<Props> = ({ inputAddress, setInputAddress }) => {
  const { t } = useTranslation();
  const [inputAddressOrName, setInputAddressOrName] = useState<string>('');

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
      <Form.Group style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Form.Control
          className="AddressInput text-center"
          placeholder={t('dashboard:address_input')}
          value={inputAddressOrName}
          onChange={handleFormInputChanged}
          onDoubleClick={() => {
            // Re-enable double-click to select
            return;
          }}
        ></Form.Control>
      </Form.Group>
    </div>
  );
};

export default AddressInput;
