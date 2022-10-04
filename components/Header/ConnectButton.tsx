import { useEthereum } from 'lib/hooks/useEthereum';
import React from 'react';
import { Button, InputGroup } from 'react-bootstrap';
import { shortenAddress } from '../common/util';
import ChainSelectDropdown from './ChainSelectDropdown';

const ConnectButton: React.FC = () => {
  const { account, ensName, unsName, connect, disconnect } = useEthereum();
  const domainName = ensName ?? unsName;

  const buttonAction = account ? disconnect : connect;
  const buttonText = account ? 'Disconnect' : 'Connect Wallet';

  return (
    <InputGroup style={{ width: 'fit-content' }}>
      <InputGroup.Prepend>
        <ChainSelectDropdown />
      </InputGroup.Prepend>
      {account && (
        <InputGroup.Text style={{ borderRadius: 0, borderColor: 'black' }}>
          {domainName ?? shortenAddress(account)}
        </InputGroup.Text>
      )}
      <InputGroup.Append style={{ marginLeft: account ? -1 : 0 }}>
        <Button variant="outline-primary" onClick={buttonAction}>
          {buttonText}
        </Button>
      </InputGroup.Append>
    </InputGroup>
  );
};

export default ConnectButton;
