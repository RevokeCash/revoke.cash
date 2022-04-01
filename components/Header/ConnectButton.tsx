import React from "react";
import { Button } from "react-bootstrap";
import { useEthereum } from "utils/hooks/useEthereum";
import { shortenAddress } from "../common/util";

const ConnectButton: React.FC = () => {
  const { account, ensName, connect } = useEthereum();

  const buttonText = ensName ?? shortenAddress(account) ?? 'Connect wallet'

  return (
    <Button variant="outline-primary" onClick={connect}>{buttonText}</Button>
  )
}

export default ConnectButton
