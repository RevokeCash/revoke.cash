import React from 'react';
import { Button, InputGroup } from 'react-bootstrap';
import { useEthereum } from 'utils/hooks/useEthereum';
import { getChainLogo, shortenAddress } from '../common/util';

const ConnectButton: React.FC = () => {
  const { account, ensName, unsName, connect, disconnect, chainId, chainName } = useEthereum();
  const domainName = ensName ?? unsName;

  const buttonAction = account ? disconnect : connect;
  const buttonText = account ? 'Disconnect' : 'Connect Wallet';

  return (
    <InputGroup style={{ width: 'fit-content' }}>
      <InputGroup.Prepend>
        <InputGroup.Text style={{ borderColor: 'black' }}>
          <img
            src={getChainLogo(chainId) ?? getChainLogo(1)}
            title={chainName}
            alt={chainName}
            height="24"
            style={{ borderRadius: '50%', minWidth: 16 }}
          />
        </InputGroup.Text>
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
