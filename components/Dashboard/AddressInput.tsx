import { track } from '@amplitude/analytics-browser';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { useEthereum } from 'utils/hooks/useEthereum';
import { parseInputAddress } from '../common/util';

interface Props {
  inputAddress: string;
  setInputAddress: (inputAddress: string) => void;
}

const AddressInput: React.FC<Props> = ({ inputAddress, setInputAddress }) => {
  const [inputAddressOrName, setInputAddressOrName] = useState<string>('');

  const { account, ensName, unsName, provider, connectionType } = useEthereum();

  // Replace the input with the connected account if nothing was connected before
  // These checks make it so that you can still enter a new input afterwards
  useEffect(() => {
    if (!account) return;
    if (inputAddress && inputAddress !== account) return;

    // When connected with Unstoppable, we prioritise UNS name over ENS name
    const domainName = connectionType === 'custom-uauth' ? unsName ?? ensName : ensName ?? unsName;

    setInputAddressOrName(domainName || account || inputAddressOrName);
  }, [ensName, account, inputAddress]);

  useEffect(() => {
    const updateInputAddress = async () => {
      const newInputAddress = await parseInputAddress(inputAddressOrName, provider);
      if (newInputAddress && newInputAddress !== inputAddress) {
        setInputAddress(newInputAddress);
        track('Updated Address', { address: newInputAddress });
      }
    };

    updateInputAddress();
  }, [inputAddressOrName, inputAddress]);

  const handleFormInputChanged = async (event: ChangeEvent<HTMLInputElement>) => {
    // If no provider is set, this means that the browser is not web3 enabled
    // and the fallback Infura provider is currently rate-limited
    if (!provider) {
      alert('Please use a web3 enabled browser to use revoke.cash');
      return;
    }

    setInputAddressOrName(event.target.value);
  };

  return (
    <Row>
      <Col className="my-auto">
        <Form.Group style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Form.Control
            className="AddressInput text-center"
            placeholder="Enter address, ENS name or Unstoppable Domain"
            value={inputAddressOrName}
            onChange={handleFormInputChanged}
            onDoubleClick={() => {
              // Re-enable double-click to select
              return;
            }}
          ></Form.Control>
        </Form.Group>
      </Col>
    </Row>
  );
};

export default AddressInput;
