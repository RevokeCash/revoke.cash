import React from "react";
import { Button } from "react-bootstrap";
import { useEthereum } from "utils/hooks/useEthereum";
import { shortenAddress } from "../common/util";

const ConnectButton: React.FC = () => {
  const { account, ensName, connect, disconnect } = useEthereum();

  const buttonText = ensName ?? "Disconnect" ?? 'Connect wallet'

  const handleDisconnect = () => disconnect(window)
  console.log("here")
  if(account) {
    return (
      <Button variant="outline-primary" onClick={handleDisconnect}>Disconnect</Button>
    )
  }

  return (
    <Button variant="outline-primary" onClick={connect}>Connect</Button>
  )
}

export default ConnectButton
