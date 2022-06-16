import React from "react";
import { Button, FormControl, InputGroup } from "react-bootstrap";
import { useEthereum } from "utils/hooks/useEthereum";
import { getChainLogo, shortenAddress } from "../common/util";

const ConnectButton: React.FC = () => {
  const { account, ensName, connect, disconnect, chainId } = useEthereum();

  const handleDisconnect = () => disconnect(window)
  if (account) {
    return (
      <InputGroup style={{ width: 'fit-content' }}>
        <InputGroup.Prepend>
          <InputGroup.Text style={{ borderColor: 'black' }}>
            <img src={getChainLogo(chainId)} height="24" style={{ borderRadius: '50%', minWidth: 16 }}></img>
          </InputGroup.Text>
        </InputGroup.Prepend>
          <InputGroup.Text style={{ borderRadius: 0, borderColor: 'black' }}>
            {ensName ?? shortenAddress(account)}
          </InputGroup.Text>
        <InputGroup.Append>
          <Button variant="outline-primary" onClick={handleDisconnect}>Disconnect</Button>
        </InputGroup.Append>
      </InputGroup>
    )
  }

  return (
    <Button variant="outline-primary" onClick={connect}>Connect</Button>
  )
}

export default ConnectButton
